package com.example.footbook.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping({
        "/",
        "/{path:^(?!api$|static$|error$|favicon\\.ico$).*$}",
        "/{path:^(?!api$|static$|error$|favicon\\.ico$).*$}/**"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
