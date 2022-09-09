import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {faEnvelope, faKey, faUser} from "@fortawesome/free-solid-svg-icons";

import {AppService} from "../app.service";

@Component({
    selector: "app-register",
    templateUrl: "./register.component.html",
    styleUrls: ["./register.component.css"]
})
export class RegisterComponent implements OnInit {
    registerForm = new FormGroup({
        name: new FormControl("", Validators.required),
        username: new FormControl("", Validators.required),
        email: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required),
    });

    faUser = faUser;
    faKey = faKey;
    faEnvelope = faEnvelope;

    constructor(private appService: AppService,
                private route: Router,
                private toaster: ToastrService) {
    }

    ngOnInit(): void {
    }

    onSubmit(): void {
        const username = this.registerForm.get("username")?.value;
        const name = this.registerForm.get("name")?.value;
        const email = this.registerForm.get("email")?.value;
        const password = this.registerForm.get("password")?.value;

        if (username != "" && name != "" && email != "" && password) {
            this.appService.register({username, name, email, password}).subscribe(
                () => this.route.navigate(["/", "login"]),
                error => {
                    // I don't get paid for this, so you won't get proper errors, only generic ones :)
                    this.toaster.error("There has been an error, most likely a user with the same already exists");
                });
        }
    }
}
