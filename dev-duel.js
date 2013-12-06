(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  Rooms = new Meteor.Collection("rooms");
  Players = new Meteor.Collection("players"); 

  //Gravatar Globals
  picUrl = '';
  twitterHandle = '';
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
        var email = $('#gravatar-email').val();
        getGravatar(email);
        var gravatarUrl = makeUrl(hash);
        
        var playerId = Players.insert(
          {
            Name: $('#github-handle').val(),
            Email: $('#gravatar-email').val(),
            Picture: gravatarUrl,
            Moves: [],
            TwitterId: Meteor.userId(),
            Room: null,
            Turn: false
          });
          
          $('.alert-success').show();
          Meteor.setTimeout(function(){window.location.assign('/craft')}, 5000);
        }
    });
        // make calls here to apis returning data to be added to player object.
    Template.craft.created = function() {
      $('#craftBoard').append('<p>Hello craft page.</p>');
      return "Hello craft page"; 
    };
   
    Template.craft.events({
      'click #clickMe' : function () {
<<<<<<< HEAD
        var twitterHandle = Meteor.user().services.twitter.screenName;

        Meteor.call("checkTwitter", function(error, result) {
            console.log(result);
        })
        
=======
        HTTP.call('GET','https://api.github.com/users/kylejson', function (error,result) {
          if(!error){
            console.log(result);
            return true;  
          } 
        }); 
        // Meteor.call('getGithubInfo');
        // twitterHandle = Meteor.user().services.twitter.screenName
        // getTwitterInfo();
>>>>>>> d55e5037327f60a6545b8b057f9cf0cb7db20006
      }

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

      Meteor.methods({
          checkTwitter: function () {
            this.unblock();

            try {
              var result = HTTP.call("GET", "https://api.github.com/users/designblooz",  
                {
                  headers: {
                    'Content-Type': 'application/json', 
                    'User-Agent': 'Awesome-Octocat-App'
                  }
                }
              );
              return result; 
            } catch (e) {
              // Got a network error, time-out or HTTP error in the 400 or 500 range.
              return false;
            }
          }
      });  
    });

<<<<<<< HEAD
    
=======
>>>>>>> d55e5037327f60a6545b8b057f9cf0cb7db20006
  }
})();
