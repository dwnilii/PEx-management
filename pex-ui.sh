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
        curl -sL https://raw.githubusercontent.com/danialkhandan/PEx-Management/main/install.sh | sudo bash
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
