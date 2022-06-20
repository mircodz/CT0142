import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }
  

  register(user:any){
    return this.http.post("http://localhost:6969/signup",user);
  }

  login(user:any){
    return this.http.post("http://localhost:6969/signin",user);
  }
  getFoo(){
    return this.http.get("http://localhost:6969/foo");
  }
}
