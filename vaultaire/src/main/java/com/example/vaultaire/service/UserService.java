package com.example.vaultaire.service;

import com.example.vaultaire.model.User;
import com.example.vaultaire.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User register(String email,String password){
        if(userRepository.findByEmail(email).isPresent()){
            throw new RuntimeException("User already exists");
        }

        User user=new User();
        user.setEmail(email);
        user.setPassword(password);

        return userRepository.save(user);

    }

    public User login(String email,String password){
        User user = userRepository.findByEmail(email).
                orElseThrow(()->new RuntimeException("user not found"));

        if(!user.getPassword().equals(password)){
            throw new RuntimeException("Invalid password");
        }

        return user;
    }

}
