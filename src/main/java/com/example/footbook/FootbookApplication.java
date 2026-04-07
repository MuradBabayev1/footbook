package com.example.footbook;

import com.example.footbook.entity.User;
import com.example.footbook.enums.UserRole;
import com.example.footbook.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class FootbookApplication {

	public static void main(String[] args) {
		SpringApplication.run(FootbookApplication.class, args);
	}

	@Bean
	CommandLineRunner bootstrapAdmin(UserRepository userRepository,
	                                PasswordEncoder passwordEncoder,
	                                @Value("${footbook.bootstrap.admin.enabled:false}") boolean enabled,
	                                @Value("${footbook.bootstrap.admin.full-name:Footbook Admin}") String fullName,
	                                @Value("${footbook.bootstrap.admin.email:admin@footbook.com}") String email,
	                                @Value("${footbook.bootstrap.admin.phone:+10000000000}") String phone,
	                                @Value("${footbook.bootstrap.admin.password:admin123456}") String password,
	                                @Value("${footbook.bootstrap.admin.reset-password:true}") boolean resetPassword) {
		return args -> {
			if (!enabled) {
				return;
			}

			if (password == null || password.isBlank() || password.length() < 10) {
				throw new IllegalStateException("Set a strong footbook.bootstrap.admin.password (min 10 chars) when bootstrap admin is enabled");
			}

			User admin = userRepository.findByEmail(email).orElseGet(User::new);
			admin.setFullName(fullName);
			admin.setEmail(email);
			admin.setPhoneNumber(phone);
			admin.setRole(UserRole.ADMIN);

			if (admin.getId() == null || resetPassword) {
				admin.setPassword(passwordEncoder.encode(password));
			}

			userRepository.save(admin);
		};
	}

}
  
