import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class AppService {
  ipAddress:any="localhost";
  constructor(private http: HttpClient) { 
    
  }
  

  register(user:any){
    return this.http.post("http://"+ this.ipAddress+":6969/signup",user);
  }

  login(user:any){
    return this.http.post("http://"+ this.ipAddress+":6969/signin",user);
  }
  addFriends(jwt:any,user:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    
    return this.http.post("http://"+ this.ipAddress+":6969/addFriends",user,httpOptions);
  }
  friends(jwt:any,user:any){

    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
  
    return this.http.post("http://"+ this.ipAddress+":6969/friend",user,httpOptions);
  }
  getAllUsers(jwt:any,data:any){

    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
  
    return this.http.post("http://"+ this.ipAddress+":6969/getAllUsers",data,httpOptions);
  }
  deleteFriend(jwt:any,data:any){

    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
  
    return this.http.post("http://"+ this.ipAddress+":6969/deleteFriend",data,httpOptions);
  }
  allUsers(jwt:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.get("http://"+ this.ipAddress+":6969/allUsers",httpOptions);
  }
  getFoo(){
    return this.http.get("http://"+ this.ipAddress+":6969/foo");
  }
  chat(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/chat",data,httpOptions);
  }
  getMatches(jwt:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.get("http://"+ this.ipAddress+":6969/matches",httpOptions);
  }
  getMatchId(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/matchId",data,httpOptions);
  }
  getHistorical(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/getHistoricalMatches",data,httpOptions);
  }
  logout(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/logout",data,httpOptions);
  }
  firstlogin(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/firstLogin",data,httpOptions);
  }
  deleteUser(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/deleteUser",data,httpOptions);
  }
  addModerator(jwt:any,data:any){
    const httpOptions = {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + jwt,
        'cache-control': 'no-cache',
        'Content-Type':  'application/json'})
    };
    return this.http.post("http://"+ this.ipAddress+":6969/addModerator",data,httpOptions);
  }
}
