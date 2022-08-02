import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http'

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
  addFriends(jwt:any,user:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://localhost:6969/addFriends",user,httpOptions);
  }
  friends(jwt:any,user:any){
    console.log(jwt)
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
  
    return this.http.post("http://localhost:6969/friend",user,httpOptions);
  }
  allUsers(jwt:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    console.log("IL TOKEN: "+jwt)
    return this.http.get("http://localhost:6969/allUsers",httpOptions);
  }
  getFoo(){
    return this.http.get("http://localhost:6969/foo");
  }
  getMatches(jwt:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.get("http://localhost:6969/matches",httpOptions);
  }
  getMatchId(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://localhost:6969/matchId",data,httpOptions);
  }
  getHistorical(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://localhost:6969/getHistoricalMatches",data,httpOptions);
  }
  logout(jwt:any,data:any){
    console.log("FACCIO IL LOGOUT "+jwt)
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://localhost:6969/logout",data,httpOptions);
  }
}
