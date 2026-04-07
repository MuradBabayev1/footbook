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
	                                @Value("${footbook.bootstrap.admin.enabled:true}") boolean enabled,
	                                @Value("${footbook.bootstrap.admin.full-name:Footbook Admin}") String fullName,
	                                @Value("${footbook.bootstrap.admin.email:muradb836@gmail.com}") String email,
	                                @Value("${footbook.bootstrap.admin.phone:+10000000000}") String phone,
	                                @Value("${footbook.bootstrap.admin.password:murad1310}") String password) {
		return args -> {
			if (!enabled || userRepository.existsByEmail(email)) {
				return;
			}

			User admin = new User();
			admin.setFullName(fullName);
			admin.setEmail(email);
			admin.setPhoneNumber(phone);
			admin.setPassword(passwordEncoder.encode(password));
			admin.setRole(UserRole.ADMIN);
			userRepository.save(admin);
		};
	}

}
  
