import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AppComponent } from '../app.component';
import { faUser, faKey, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { AppService } from '../app.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  faUser = faUser;
  faKey = faKey;
  faEnvelope = faEnvelope;

  constructor(private appService:AppService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if(this.registerForm.get("username")?.value != "" && this.registerForm.get("name")?.value != "" && this.registerForm.get("email")?.value != "" && this.registerForm.get("password")?.value != ""){
      this.appService.register({name:this.registerForm.get("name")?.value,username:this.registerForm.get("username")?.value,email:this.registerForm.get("email")?.value,password:this.registerForm.get("password")?.value}).pipe().subscribe(
        () => this.toggleShow()
      );
    }
  }
  toggleShow(){
    AppComponent.toggleShow();
  }

}
