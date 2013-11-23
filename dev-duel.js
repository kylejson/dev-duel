(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  rooms = new Meteor.Collection("games");

  //Api Stuff
  githudBaseURL = 'https://api.github.com/users/'; 
  githubStats = ['followers','repos','following','orgs'];
  twitterStats = []; 

  //player object
  Player = {
    id: '', 
    moves: '',
  };
  //game object
  Game = {

  };
/*********************
Meteor on the Client
********************/
  if (Meteor.isClient) {
    //home page client functions/events
    Temlat.home.players = function(Players){
      return Players.length; 
    }
    Template.home.events({
      'click .play' : function () {
          window.location.assign('/form');
      }
    });
    //form page client functions/events
    Template.form.events({
      //submit
      'submit #myform' : function (e) {
        e.preventDefault();
        window.location.assign('/craft');
    });
    //craft page client functions/events
    Template.craft.events({
      //add to recipe

      //remove from recipe 

      //click ready or submit form 

    });

/*********************
Router configurations
********************/
    Router.configure({
      layoutTemplate: 'hello'
    });
      
    Router.map(function() { 
      this.route('home', {
        path: '/',
        template: 'home'
      });
      this.route('form', {
        path: '/form',
        template: 'formPage'
      });
      this.route('home1', {
        path: 'home1',
        template: 'home1'
      });
      this.route('craft', {
        path: '/craft',
        template: 'craft'
      });
      this.route(room_Id, {
        path: room_Id,
        tempalte: 'game' 
      });
    });
  }
/*********************
Meteor on the Server
********************/
  if (Meteor.isServer) {
    Meteor.startup(function () {
      // code to run on server at startup
    });
    //Make twitter api call and publish in array  
  }
})();
