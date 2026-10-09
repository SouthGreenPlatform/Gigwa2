package fr.cirad.web.controller;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import fr.cirad.security.GigwaClientRegistrationRepository;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestClientException;

import fr.cirad.security.GigwaAuthenticationSuccessHandler;
import fr.cirad.tools.AppConfig;

import org.springframework.web.servlet.ModelAndView;

import fr.cirad.service.PasswordResetService;

@Controller
public class GigwaAuthenticationController  {
	private static final Logger LOG = Logger.getLogger(GigwaAuthenticationController.class);
		
	public static final String LOGIN_LOST_PASSWORD_URL = "/lostPassword.do";
	public static final String LOGIN_RESET_PASSWORD_URL = "/resetPassword.do";
	private static final String LOGIN_CAS_URL = "/login/cas.do";
	private static final String LOGIN_FORM_URL = "/login.do";
	private static final String INITIATE_CAS_URL = "/initiateCasLogin.do";

	@Autowired private PasswordResetService passwordResetService;
	@Autowired private GigwaAuthenticationSuccessHandler authenticationSuccessHandler;
	@Autowired private AppConfig appConfig;
	@Autowired private GigwaClientRegistrationRepository gigwaRegistrationRepository;

	@GetMapping(INITIATE_CAS_URL)
	public String initiateCasLogin(HttpServletRequest request) {
	    String referer = request.getHeader("Referer");
	    if (referer != null && !referer.isBlank()) {
	        // Store the React app's origin (strip path, keep base URL)
	        try {
	            URL refererUrl = new URL(referer);
	            String base = refererUrl.getProtocol() + "://" + refererUrl.getHost()
	                + (refererUrl.getPort() != -1 ? ":" + refererUrl.getPort() : "")
	                + new URL(referer).getPath().replaceAll("/[^/]*$", "/");
	            request.getSession().setAttribute("casReturnTo", base);
	        } catch (MalformedURLException ignored) {}
	    }
	    return "redirect:" + appConfig.get("casServerURL") + "?service=" + URLEncoder.encode(appConfig.get("enforcedWebapRootUrl") + LOGIN_CAS_URL, StandardCharsets.UTF_8);
	}
	
	@GetMapping(LOGIN_FORM_URL)
	public ModelAndView loginFormPath(HttpServletRequest request, HttpServletResponse response) throws RestClientException, URISyntaxException {
		Iterator<ClientRegistration> oAuth2ServerIterator = gigwaRegistrationRepository.iterator();
		ArrayList<ClientRegistration> oauth2Providers = new ArrayList<>();
		while (oAuth2ServerIterator.hasNext())
			oauth2Providers.add(oAuth2ServerIterator.next());
		request.setAttribute("oauth2Providers", oauth2Providers);
		
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
	public String casLoginPath(@RequestParam(name="url", required=false) String redirectUrl, HttpServletRequest request) {
	    if (redirectUrl != null && !redirectUrl.isBlank())
	        return "redirect:" + URLDecoder.decode(redirectUrl, StandardCharsets.UTF_8);

	    String sessionReturn = (String) request.getSession().getAttribute("casReturnTo");
	    if (sessionReturn != null) {
	        request.getSession().removeAttribute("casReturnTo");
	        String sep = sessionReturn.contains("?") ? "&" : "?";
	        return "redirect:" + sessionReturn + sep + "casAuth=1";
	    }
	    return "redirect:/index.jsp";
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

		boolean updated;
		try {
			updated = passwordResetService.updatePassword(code, newPassword);
		}
		catch (IOException e) {
			LOG.error("Error while overriding user password", e);
			model.addAttribute("error", "Unable to save new password due to a server-side error. Please contact the administrator.");
			return "redirect:" + LOGIN_RESET_PASSWORD_URL;
		}
		if (updated) {
			model.addAttribute("message", "Password updated successfully. You may now login.");
			return "redirect:" + LOGIN_FORM_URL;
		} else {
			model.addAttribute("error", "Invalid or expired code. Please try again.");
			return "redirect:" + LOGIN_RESET_PASSWORD_URL;
		}
	}

	@Autowired
	private FilterChainProxy filterChainProxy;

	public void printFilters() {
		filterChainProxy.getFilterChains().forEach(chain -> {
			System.out.println("### Filter chain: " + chain);
			chain.getFilters().forEach(f -> System.out.println("  -> " + f.getClass().getName()));
		});
	}
}