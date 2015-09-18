"use strict";
var app = angular.module('brh.controllers', []);


app.controller('checkin.ctrl', ['$scope', '$http', function ($scope, $http) {
    $scope.users = [];
    $scope.inputSearch = "";

    $scope.filterSearch = function(user) {
        var input = $scope.inputSearch.toLowerCase();
        var name = (user.name.first + " " + user.name.last).toLowerCase();
        return (input == "" || name.indexOf(input) != -1);
    };

    $scope.filterCheckedIn = function(user) {
        return !user.internal.checkedin;
    };




    $scope.confirmation = false;

    $scope.derpToken = "";

    $scope.loadUsers = function () {
        $http.get('/api/admin/users/signin')
            .success(function (data, status, headers, config) {
                $scope.users = data;
                console.log("Got users", data);
            })
            .error(function (data, status, headers, config) {
                console.log("Failed getting users", data, status, headers);
            });
    };

    $scope.checkinUser = function(pubid) {
        $http({
            method: 'PATCH',
            url: '/api/admin/user/' + pubid +'/checkin',
            data: {
                checkedin: true
            }
        });
    };

    $scope.loadUsers();

/*
    $scope.add = function () {
        $http({
            method: 'POST',
            url: Backand.getApiUrl() + '/1/objects/joinResults?returnObject=true',
            headers: {
                'Authorization': $scope.derpToken
            },
            data: {
                "first": $scope.first,
                "last": $scope.last,
                "cid": $scope.id,
                "skill": $scope.skill
            }
        });
    };
*/
}]);