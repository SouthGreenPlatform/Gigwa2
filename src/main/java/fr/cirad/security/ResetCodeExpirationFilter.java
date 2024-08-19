package fr.cirad.security;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.time.LocalDateTime;

public class ResetCodeExpirationFilter implements Filter {

    private static final String RESET_EXPIRATION_KEY = "resetExpiration";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpSession session = httpRequest.getSession(false);

        if (session != null) {
            LocalDateTime expiration = (LocalDateTime) session.getAttribute(RESET_EXPIRATION_KEY);
            if (expiration != null && expiration.isBefore(LocalDateTime.now())) {
                // Clear expired reset information
                session.removeAttribute("resetCode");
                session.removeAttribute("resetEmail");
                session.removeAttribute(RESET_EXPIRATION_KEY);
            }
        }

        chain.doFilter(request, response);
    }
}