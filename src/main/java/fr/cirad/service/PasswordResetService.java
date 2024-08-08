package fr.cirad.service;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class PasswordResetService {

    private Map<String, String> resetCodes = new HashMap<>();
    private Map<String, LocalDateTime> codeExpirations = new HashMap<>();

    @Autowired
    private EmailService emailService;

    @Autowired private ReloadableInMemoryDaoImpl userDao;

    public String generateResetCode() {
        return String.format("%08d", new Random().nextInt(100000000));
    }

    public boolean sendResetPasswordEmail(String email) {
        String resetCode = generateResetCode();
        resetCodes.put(resetCode, email);
        codeExpirations.put(resetCode, LocalDateTime.now().plusMinutes(5)); // Code valid for 5 minutes
        return emailService.sendResetPasswordEmail(email, resetCode);
    }

    public boolean validateResetCode(String code) {
        if (!resetCodes.containsKey(code)) {
            return false;
        }
        LocalDateTime expiration = codeExpirations.get(code);
        boolean isValid = expiration.isAfter(LocalDateTime.now());

        // Remove the code after checking its validity
        resetCodes.remove(code);
        codeExpirations.remove(code);

        return isValid;
    }

    public boolean updatePassword(String code, String newPassword) {
        boolean isValid = validateResetCode(code);

        if (!isValid) {
            return false;
        }

        String email = resetCodes.get(code);
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null) {
            return false;
        }

        try {
            userDao.saveOrUpdateUser(user.getUsername(), newPassword, user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toArray(String[]::new), user.isEnabled(), user.getMethod(), user.getEmail());
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }

        resetCodes.remove(code);
        codeExpirations.remove(code);
        return true;
    }
}
