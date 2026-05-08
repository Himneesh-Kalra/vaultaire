package com.example.vaultaire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling

public class VaultaireApplication {

	public static void main(String[] args) {
		SpringApplication.run(VaultaireApplication.class, args);

	}

}
