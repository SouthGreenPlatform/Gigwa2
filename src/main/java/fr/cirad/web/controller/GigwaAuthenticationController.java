package fr.cirad.web.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import fr.cirad.security.GigwaAuthenticationSuccessHandler;
import fr.cirad.service.PasswordResetService;

@Controller
public class GigwaAuthenticationController {
	
	private static final Logger LOG = Logger.getLogger(GigwaAuthenticationController.class);
	
	public static final String LOGIN_LOST_PASSWORD_URL = "/lostPassword.do";
	public static final String LOGIN_RESET_PASSWORD_URL = "/resetPassword.do";
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	private static final String LOGIN_FORM_URL = "/login.do";

	@Autowired
	private PasswordResetService passwordResetService;

	@Autowired
	private GigwaAuthenticationSuccessHandler authenticationSuccessHandler;

	@GetMapping(LOGIN_FORM_URL)
	public ModelAndView loginFormPath(HttpServletRequest request, HttpServletResponse response) {
		SavedRequest savedRequest = authenticationSuccessHandler.getRequestCache().getRequest(request, response);
		if (savedRequest != null) {
			String targetUrl = savedRequest.getRedirectUrl();
			try {
				String redirectUrl = URLEncoder.encode(targetUrl, StandardCharsets.UTF_8.name());
				request.setAttribute("loginOrigin", redirectUrl);
			} catch (UnsupportedEncodingException ignored) {}
		}
		ModelAndView mav = new ModelAndView();
		mav.addObject("resetPasswordEnabled", passwordResetService.seemsProperlyConfigured());
		return mav;
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
	public void lostPasswordForm() {
	}

	@PostMapping(LOGIN_LOST_PASSWORD_URL)
	public String sendResetPasswordEmail(@RequestParam String email, HttpServletRequest request, Model model) {
		try {
			passwordResetService.sendResetPasswordEmail(email, request);
			model.addAttribute("message", "If this e-mail address matches a user account, a 5-minute valid code has just been sent to it.");
			return "redirect:" + LOGIN_RESET_PASSWORD_URL;
		}
		catch (Exception e) {
			LOG.error("Unable to send password reset email", e);
			model.addAttribute("error", "An error occured while sending e-mail. If problem persists please contact administrator.");
			return "redirect:" + LOGIN_LOST_PASSWORD_URL;
		}
	}
	
	@GetMapping(LOGIN_RESET_PASSWORD_URL)
	public void resetPasswordForm() {
	}

	@PostMapping(LOGIN_RESET_PASSWORD_URL)
	public String resetPassword(@RequestParam String code, @RequestParam String newPassword, Model model) {
		if (newPassword.length() > 20) {
			model.addAttribute("error", "Password must not exceed 20 characters.");
			return "redirect:" + LOGIN_RESET_PASSWORD_URL;
		}

		boolean updated = passwordResetService.updatePassword(code, newPassword);
		if (updated) {
			model.addAttribute("message", "Password updated successfully. You may now login.");
			return "redirect:" + LOGIN_FORM_URL;
		} else {
			model.addAttribute("error", "Invalid or expired code. Please try again.");
			return "redirect:" + LOGIN_RESET_PASSWORD_URL;
		}
	}
}