(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//load angular
var app = angular.module('scotch-chat', ['ngMaterial', 'ngAnimate', 'ngMdIcons', 'btford.socket-io']);
//set our server url
var serverBaseUrl = 'http://127.0.0.1:2015';

//services to interact with nodewebkit GUI and Window
app.factory('GUI', function(){
    //return nw.gui
    return window.require('nw.gui');
});//app.factory

app.factory('Window', function(GUI){
    return GUI.Window.get();
});
//services to interact with socket library
app.factory('socket', function (socketFactory) {
    var myIoSocket = io.connect(serverBaseUrl);

    var socket = socketFactory({
        ioSocket: myIoSocket
    });//socket
    return socket;

});//app.factory('socket')

app.directive('ngEnter', function(){
    //this snippet lets binds an event to the enter key, which thereby an event can be triggered when the key is pressed
    return function(scope, element, attrs){
        element.bind("keydown keypress", function (event) {
            if(event.which === 13)
            {
                scope.$apply(function ()
                {
                    scope.$eval(attrs.ngEnter);
                });//scope.$apply
                event.preventDefault();
            }//if

        });
    };//returned function
});//app.directives
//Create a list of window menus from using the rooms emitted from the server.
//The user on joining is expected to provided his/her username
//Listen for a new message from the server
//notify the server of new messages when they are created by typing and hitting the enter key
//Our Controller
app.controller('MainCtrl', function($scope, Window, GUI, $mdDialog, socket, $http){
    //=========Menu setup=============
    //global scope
    $scope.messages = [];
    $scope.room = "";
    //build window menu for our app using the GUI and window service
    var windowMenu = new GUI.Menu({
        type: 'menuber'
    });//windowMenu
    //crate an instance of menu
    var roomMenu = new GUI.Menu();
    //append some menu(rooms and exit)
    windowMenu.append(new GUI.MenuItem({
        label: 'Rooms',
        submenu: roomsMenu
    }));
    windowMenu.append(new GUI.MenuItem({
        label: 'Exit',
        click: function(){
            Window.close();
        }
    }));
    //Modal setup=============================
    //Listen for the setup event and create rooms
    socket.on('setup', function(data){
        var rooms = data.rooms;
        for (var r = 0; r < rooms.length; r++)
        {
            //Loop and append room to the window room menu
            handleRoomSubMenu(r);
        }
        function handleRoomSubMenu(r)
        {
            var clickedRoom = rooms[r];
            //append each room to the menu
            roomsMenu.append(new GUI.MenuItem({
                lablel: clickedRoom.toUpperCase(),
                click: function(){
                    //what happens on clicking the rooms? ==> swtich room
                    $scope.room = clickedRoom.toUpperCase();
                    //Notify the server that the user changed his room
                    socket.emit('switch room', {
                        newRoom: clickedRoom,
                        username: $scope.username
                    });
                    //Fetch the new room messages
                    $http.get(serverBaseUrl + '/msg?room='+ clickedRoom).success(function (msgs) {
                        $scope.messages = msgs;
                    });
                }//anonymous function
            }));//append
        }//handleRoomSubmenu(r)
        //Attach menu
        GUI.Window.get().menu = windowMenu;
    });//socket setuo

    //this function below will be called from index.html
    $scope.usernameModal = function(ev){
        //Launch Modal to get username
        $mdDialog.show({
            controller: UsernameDialogController,
            templateUrl: 'partials/username.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev
        })
            .then(function (answer) {
                //set username with the value returned from the modal
                $scope.username = answer;
                //tell the server there is a new user
                socket.emit('new user', {
                    username: answer
                });//emit
                $scope.room = 'GENERAL';
                //Fetch chat message in General
                $http.get(serverBaseUrl+ '/msg?room='+$scope.room).sucess(function (msgs) {
                    $scope.messages = msgs;
                });

            }, function(){
                //if it is not successful we close the app.
                Window.close();
            });//then
    };// $scope.usernameModal







    //listen for new message
    socket.on('message created', function(data){
        //push to new message to our $scope.messages
        $scope.messages.push(data);
        //empty the textarea
        $scope.messages = "";
    });

    //notify server of the new message
    $scope.send = function(msg){
        //notify the server that there is a new message with the message as packet
        socket.emit('new message', {
            room: $scope.room,
            message: msg,
            username: $scope.username
        });
    };
});
//Dialog controller
function UsernameDialogController($scope, $mdDialog){
    $scope.answer = function(answer)
    {
        $mdDialog.hide(answer);
    };// $scope.answer
}

/*'use strict';

angular.module('scotch-chat', [])
  .factory('GUI', function() {
    return require('nw.gui');
  })
  .factory('Window', ['GUI', function(gui) {
    return gui.Window.get();
  }])
  .controller('Toolbar', ['$scope', 'Window',
    function($scope, Window) {
      /*
      
      Custom Control for Window operations

      $scope.minimize = function() {
        Window.minimize();
      };

      $scope.toggleFullscreen = function() {
        Window.toggleKioskMode();
      };

      $scope.close = function() {
        Window.close();
      };*/
    /*}
  ]);
*/
},{}]},{},[1]);
