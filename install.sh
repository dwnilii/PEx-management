#!/bin/bash

# PEx-Management Installer Script
# This script automates the installation of the PEx-Management panel on a Debian/Ubuntu server.

# --- Configuration ---
REPO_URL="https://github.com/dwnilii/PEx-management.git"
INSTALL_DIR="PEx-Management"
PM2_APP_NAME="pex-management"
NODE_VERSION="18" # Required Node.js version

# --- Colors for output ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'

# --- Helper Functions ---
print_info() {
    echo -e "${C_BLUE}[INFO] $1${C_RESET}"
}

print_success() {
    echo -e "${C_GREEN}[SUCCESS] $1${C_RESET}"
}

print_warning() {
    echo -e "${C_YELLOW}[WARNING] $1${C_RESET}"
}

print_error() {
    echo -e "${C_RED}[ERROR] $1${C_RESET}"
    exit 1
}

# --- Main Installation Logic ---

# 1. Check for root privileges
if [ "$EUID" -ne 0 ]; then
    print_warning "This script is designed to be run with root privileges."
    print_warning "Please run it with sudo: sudo bash <(curl -sL ...)"
    # exit 1 # Commented out to allow non-root, but warn.
fi

# 2. Update package lists
print_info "Updating package lists..."
apt-get update -y || print_warning "Could not run apt-get update. Proceeding anyway."

# 3. Install necessary dependencies (curl, git)
print_info "Installing dependencies (curl, git)..."
apt-get install -y curl git || print_error "Failed to install essential dependencies."

# 4. Install Node.js and npm
print_info "Checking for Node.js..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt $NODE_VERSION ]]; then
    print_info "Node.js not found or version is too old. Installing Node.js v$NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    apt-get install -y nodejs || print_error "Failed to install Node.js."
else
    print_success "Node.js is already installed and meets version requirements."
fi

# 5. Install PM2 process manager
print_info "Checking for PM2..."
if ! npm list -g --depth=0 | grep -q pm2; then
    print_info "Installing PM2 globally..."
    npm install pm2 -g || print_error "Failed to install PM2."
else
    print_success "PM2 is already installed."
fi

# 6. Clone the repository
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory '$INSTALL_DIR' already exists. Skipping clone."
else
    print_info "Cloning the PEx-Management repository..."
    git clone "$REPO_URL" "$INSTALL_DIR" || print_error "Failed to clone repository."
fi

cd "$INSTALL_DIR" || print_error "Failed to enter the installation directory."

# 7. Create .env file
if [ -f ".env" ]; then
    print_success ".env file already exists."
else
    print_info "Creating .env file..."
    touch .env
    echo "ADMIN_USERNAME=admin" >> .env
    echo "ADMIN_PASSWORD=admin" >> .env
    print_warning "A default .env file has been created. Please edit it to set your secure credentials."
fi

# 8. Install project dependencies
print_info "Installing project dependencies..."
npm install || print_error "npm install failed."

# 9. Build the Next.js application
print_info "Building the application for production..."
npm run build || print_error "npm run build failed."

# 10. Start the application with PM2
print_info "Starting the application with PM2..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 start npm --name "$PM2_APP_NAME" -- start || print_error "Failed to start the application with PM2."

# 11. Configure PM2 to start on system startup
print_info "Configuring PM2 to start on boot..."
pm2 startup | tail -n 1 | bash || print_warning "Could not execute pm2 startup command. You may need to run it manually."
pm2 save || print_warning "Could not save PM2 process list."

# 12. Create the management UI script
print_info "Creating management UI script (pex-ui.sh)..."
cat > pex-ui.sh << 'EOF'
#!/bin/bash

# PEx-Management UI Script

# --- Colors for output ---
C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'

# --- App Configuration ---
PM2_APP_NAME="pex-management"
INSTALL_DIR=$(pwd)

# --- Functions for Menu ---
uninstall_app() {
    echo -e "${C_YELLOW}This will stop the service, delete all project files, and remove the PM2 process.${C_RESET}"
    read -p "Are you sure you want to uninstall? [y/N]: " confirm
    if [[ "$confirm" =~ ^[yY](es)?$ ]]; then
        echo "Stopping and deleting PM2 process..."
        pm2 stop "$PM2_APP_NAME" && pm2 delete "$PM2_APP_NAME"
        pm2 save
        echo "Removing project directory: $INSTALL_DIR"
        cd .. && rm -rf "$INSTALL_DIR"
        echo -e "${C_GREEN}PEx-Management has been uninstalled.${C_RESET}"
    else
        echo "Uninstall cancelled."
    fi
}

reinstall_app() {
    echo -e "${C_YELLOW}This will stop the service, delete project files, and reinstall from GitHub.${C_RESET}"
    read -p "Are you sure you want to reinstall? [y/N]: " confirm
     if [[ "$confirm" =~ ^[yY](es)?$ ]]; then
        echo "Stopping service..."
        pm2 stop "$PM2_APP_NAME"
        echo "Re-running installation script..."
        curl -sL https://raw.githubusercontent.com/dwnilii/PEx-management/main/install.sh | sudo bash
        echo -e "${C_GREEN}Reinstallation complete.${C_RESET}"
    else
        echo "Reinstall cancelled."
    fi
}

backup_now() {
    echo "Creating a new backup..."
    # We use curl to hit the POST endpoint of our backup API
    curl -X POST -H "Content-Type: application/json" http://localhost:3000/api/backup
    echo -e "\n${C_GREEN}Backup creation command sent. Check the panel for results.${C_RESET}"
}

change_credentials() {
    echo "Opening .env file for editing. Please change ADMIN_USERNAME and ADMIN_PASSWORD."
    read -p "Press [Enter] to open the file in 'nano' editor..."
    if command -v nano &> /dev/null; then
        nano .env
    else
        vi .env
    fi
    echo "Restarting service to apply changes..."
    pm2 restart "$PM2_APP_NAME"
    echo -e "${C_GREEN}Service restarted. New credentials should be active.${C_RESET}"
}

show_status() {
    echo -e "${C_BLUE}Displaying status for '$PM2_APP_NAME'...${C_RESET}"
    pm2 list
}

# --- Main Menu Display ---
while true; do
    echo -e "\n${C_BLUE}--- PEx-Management Control Panel ---${C_RESET}"
    echo "1) Uninstall"
    echo "2) Reinstall"
    echo "3) Create New Backup"
    echo "4) Change Admin User/Password"
    echo "5) Service Status (PM2)"
    echo "0) Exit"
    echo -e "------------------------------------"
    read -p "Please select an option: " choice

    case $choice in
        1) uninstall_app ;;
        2) reinstall_app ;;
        3) backup_now ;;
        4) change_credentials ;;
        5) show_status ;;
        0) break ;;
        *) echo -e "${C_YELLOW}Invalid option. Please try again.${C_RESET}" ;;
    esac
done

echo -e "${C_GREEN}Exiting control panel.${C_RESET}"
EOF

chmod +x pex-ui.sh || print_warning "Could not make pex-ui.sh executable."

# --- Final Instructions ---
print_success "PEx-Management has been successfully installed!"
print_info "The application is running under PM2 with the name '$PM2_APP_NAME'."
print_info "Your panel should be accessible at http://<your_server_ip>:3000"
print_warning "IMPORTANT: Please edit the '.env' file in '$INSTALL_DIR' to set a secure admin username and password."
print_info "You can use the management script './pex-ui.sh' inside the '$INSTALL_DIR' directory."
