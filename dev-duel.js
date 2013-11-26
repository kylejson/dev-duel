(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  rooms = new Meteor.Collection("games");

  //Api Stuff
  githudBaseURL = 'https://api.github.com/users/'; 
  picUrl = '';
  hash = '';
  githubStats = ['followers','repos','following','orgs'];
  twitterStats = []; 
  Players = {};
  //player object
  Player = {
    id: '', 
    moves: '',
  };
  //game object
  Game = {

  };
  room_Id = " ";

/*********************
Gravatar Function
********************/
  function getGravatar(email){
    hash = $.md5(email);
    return hash;
  }
  function makeUrl(hash){
    var baseUrl = 'http://gravatar.com/avatar/';
    var picUrl = baseUrl + hash + '.jpg?s=50';
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
      'submit #data-form' : function (e) {
        e.preventDefault();

        var email = $('#gravatar-email').val();
        var twitter = $('#twitter-handle').val();
        var github = $('#github-handle').val();
        if(email != ""){
          getGravatar(email);
          var gravatarUrl = makeUrl(hash);
          $('.form-group').append('<img src="'+ gravatarUrl+ '"/>');
        }
        // window.location.assign('/craft');
        // make calls here to apis returning data to be added to player object.
      }
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
    //Make twitter api call and publish in array
    Twit = new TwitMaker({
        consumer_key:         '...',
        consumer_secret:      '...',
        access_token:         '...',
        access_token_secret:  '...'
    });  
  }
})();
