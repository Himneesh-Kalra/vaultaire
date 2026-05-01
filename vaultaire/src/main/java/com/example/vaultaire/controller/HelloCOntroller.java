package com.example.vaultaire.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloCOntroller {

    @GetMapping("/hello")
    public String hello(){
        return "Hello";
    }
}
