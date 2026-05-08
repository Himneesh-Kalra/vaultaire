package com.example.vaultaire.controller;

import com.example.vaultaire.model.User;
import com.example.vaultaire.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestParam String email,
                                      @RequestParam String password){
        User user=userService.register(email,password);
        return ResponseEntity.ok("User registered: "+ user.getEmail());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email,
                                   @RequestParam String password){

        User user=userService.login(email, password);
        return ResponseEntity.ok("Login Successful: "+ user.getId());
    }
}
