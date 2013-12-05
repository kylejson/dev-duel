(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  Rooms = new Meteor.Collection("rooms");
  Players = new Meteor.Collection("players"); 

  //Gravatar Globals
  picUrl = '';
  hash = '';
  //Github 
  githudBaseURL = 'https://api.github.com/users/'; 
  githubStats = ['followers','repos','following','orgs'];

/*********************
Gravatar Function
********************/
  function getGravatar(email){
    hash = $.md5(email);
    return hash;
  }
  function makeUrl(hash){
    var baseUrl = 'http://gravatar.com/avatar/';
    var picUrl = baseUrl + hash + '.jpg?s=100';
    return picUrl; 
  }
/*********************
Meteor on the Client
********************/
  if (Meteor.isClient) {
    
    //home page client functions/events
    Template.home.events({
      'click .play' : function () {
        window.location.assign('/form');
      }
    });
    //form page client functions/events
    Template.formPage.events({
      //submit
      'keyup #gravatar-email' : function () {
          var email = $('#gravatar-email').val();
          getGravatar(email);
          var gravatarUrl = makeUrl(hash);
          $('.pic').empty();
          $('.pic').append('<img src="'+ gravatarUrl+ '"/>');
      },
      'submit #data-form' : function (e) {
        e.preventDefault();
        var playerId = Players.insert(
          {
            Name: $('#github-handle').val(),
            Email: $('#gravatar-email').val(),
            Picture: picUrl,
            Moves: [],
            TwitterId: Meteor.userId()
          });
          
          $('.alert-success').show();
          Meteor.setTimeout(window.location.assign('/craft'), 10000);
        }
        
        // make calls here to apis returning data to be added to player object.
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
      this.route('craft', {
        path: '/craft',
        template: 'craft'
      });
      this.route('game', {
        path: '/game',
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
  }
})();
