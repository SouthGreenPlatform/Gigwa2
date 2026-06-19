package fr.cirad.tools.security;

import java.util.List;
import java.util.Map;

public class UserInfo {
    private String username;
    private boolean admin = false;
    private boolean canCreateDB = false;

    private Map<String, Object> roles;


    public UserInfo() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isCanCreateDB() {
        return canCreateDB;
    }

    public void setCanCreateDB(boolean canCreateDB) {
        this.canCreateDB = canCreateDB;
    }

    public Map<String, Object> getRoles() {
        return roles;
    }

    public void setRoles(Map<String, Object> roles) {
        this.roles = roles;
    }
}
