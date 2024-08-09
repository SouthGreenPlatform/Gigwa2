package fr.cirad.web.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Random;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import fr.cirad.security.GigwaAuthenticationSuccessHandler;
import fr.cirad.service.PasswordResetService;

@Controller
public class GigwaAuthenticationController {
	private static final String LOGIN_LOST_PASSWORD_URL = "/lostPassword.do";
	private static final String LOGIN_RESET_PASSWORD_URL = "/resetPassword.do";
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	private static final String LOGIN_FORM_URL = "/login.do";

	@Autowired
	private PasswordResetService passwordResetService;

	@Autowired
	private GigwaAuthenticationSuccessHandler authenticationSuccessHandler;

	@GetMapping(LOGIN_FORM_URL)
	public String loginFormPath(HttpServletRequest request, HttpServletResponse response) {
		SavedRequest savedRequest = authenticationSuccessHandler.getRequestCache().getRequest(request, response);
		if (savedRequest != null) {
			String targetUrl = savedRequest.getRedirectUrl();
			try {
				String redirectUrl = URLEncoder.encode(targetUrl, StandardCharsets.UTF_8.name());
				request.setAttribute("loginOrigin", redirectUrl);
			} catch (UnsupportedEncodingException ignored) {}
		}
		return "login";
	}

	@GetMapping(LOGIN_CAS_URL)
	public String casLoginPath(@RequestParam(name="url", required=false) String redirectUrl) {
		if (redirectUrl != null && !"".equals(redirectUrl.trim())) {
			try {
				return "redirect:" + URLDecoder.decode(redirectUrl, StandardCharsets.UTF_8.name());
			} catch (UnsupportedEncodingException exc) {
				return "redirect:/index.jsp";
			}
		} else {
			return "redirect:/index.jsp";
		}
	}

	@GetMapping(LOGIN_LOST_PASSWORD_URL)
	public String lostPasswordForm() {
		return "lostPassword";
	}

	@PostMapping(LOGIN_LOST_PASSWORD_URL)
	public String sendResetPasswordEmail(@RequestParam String email, HttpSession session, Model model) {
		passwordResetService.sendResetPasswordEmail(email, session);
		model.addAttribute("message", "If this e-mail address matches a user account, a code valid for 5 minutes has just been sent to it.");
		return "resetPassword";
	}

	@PostMapping(LOGIN_RESET_PASSWORD_URL)
	public String resetPassword(@RequestParam String code, @RequestParam String newPassword, HttpSession session, Model model) {
		if (newPassword.length() > 20) {
			model.addAttribute("error", "Password must not exceed 20 characters.");
			return "resetPassword";
		}

		boolean updated = passwordResetService.updatePassword(code, newPassword, session);
		if (updated) {
			model.addAttribute("message", "Password updated successfully. You can now login.");
			return "login";
		} else {
			model.addAttribute("error", "Invalid or expired code. Please try again.");
			return "resetPassword";
		}
	}
}
