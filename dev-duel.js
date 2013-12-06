(function(){
/*********************
 Global variables and Functions
********************/
  //rooms with hold game session and two player objects
  Rooms = new Meteor.Collection("rooms");
  Move = {
    init: function(title, damage, used) {
      this.title = title;
      this.damage = damage;
      this.used = used;
    }
  };
  
  //Gravatar Globals
  picUrl = '';
  twitterHandle = '';
  githubHandle = '';
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
        Router.go('/form');
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
        
        var playerId = Users.insert(
          {
            Player :{ 
              Name: $('#github-handle').val(),
              Email: $('#gravatar-email').val(),
              Picture: gravatarUrl,
              Moves: [],
              Room: null,
              Turn: false
            }
          });
          
          $('.alert-success').show();
          Meteor.setTimeout(function(){Router.go('/craft')}, 5000);
        }
    });
        // make calls here to apis returning data to be added to player object.
    Template.craft.created = function() {
      //Call for Github Data
      HTTP.call('GET','https://api.github.com/users/' + Meteor.user().Player.Name, function (error,result) {
          var github = result.data;
          if(!error){
            $('#gh-followers').append(github.followers);
            $('#gh-following').append(github.following);
            $('#gh-repos').append(github.public_repos);
            $('#gh-gists').append(github.public_gists);
            return true;  
          } 
      });

      Meteor.call("twitterData", function(error, result) {
          var twitter = result.data;
          $('#tw-followers').append(twitter.followers_count);
          $('#tw-following').append(twitter.friends_count);
          $('#tw-tweets').append(twitter.statuses_count);
          $('#tw-retweets').append(twitter.status.retweet_count);
          $('#tw-favorites').append(twitter.favourites_count);
      });  
      
    };
   
    Template.craft.events({

      'click .ready' : function () {
        console.log("User: " + Meteor.userId());

        var room = Rooms.findOne({PlayerCount: {$lt :2} });
        if(room) {
          room.update({ 
            Players: Meteor.user().Player
          });
        
        }else{  
          Rooms.insert({
            PlayerCount: 0,
            Players: [],
            Room : ''
          });

        } 

        // Meteor.call('getGithubInfo');
        // twitterHandle = Meteor.user().services.twitter.screenName
        // getTwitterInfo();
      }
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

    // Server side methods
    Meteor.methods({
 /*      twitterData: function() {
        this.unblock(); 
        var twitterHandle = Meteor.user().services.twitter.screenName

        try {
          var result = HTTP.call("GET", "http://designblooz.com/twitter/api.php/users/show.json",
            {  
              params: {
                screen_name: twitterHandle
              },
              headers: {
                'Content-Type': 'application/json'
              }
            }

          );
          return result; 
        } catch (e) {
          // Got a network error, time-out or HTTP error in the 400 or 500 range.
          return false;
        }
      }

             {*/
      twitterData: function () {
        this.unblock(); 
        var twitterHandle = Meteor.user().services.twitter.screenName
        var config = Accounts.loginServiceConfiguration.findOne({service: 'twitter'});
        var base64AuthToken = new Buffer(config.consumerKey + ":" + config.secret).toString('base64');
        var token;
        try {
          token = HTTP.call("POST", "https://api.twitter.com/oauth2/token",
            {
                params: {
                  'grant_type': 'client_credentials'
                },            
                headers: {
                  'Authorization': 'Basic ' + base64AuthToken,
                  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                }             
            }  
          );
          try {
            var result = HTTP.call('GET',
              "https://api.twitter.com/1.1/users/show.json", {
              params : {screen_name: twitterHandle},
              headers : {
                'Authorization': 'Bearer ' + token.data.access_token
              }
            });
            return result; 
          } catch (e) {
            return false;
          }
        } catch (e) {
          // Got a network error, time-out or HTTP error in the 400 or 500 range.
          return false;
        }
      }
    });  
  }
})();