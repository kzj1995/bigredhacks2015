"use strict";
var app = angular.module('brh.controllers', []);

app.controller('signin.ctrl', ['$scope', '$http', function ($scope, $http) {


    $scope.users = [];


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

    $scope.checkinUser = function(user) {

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

        $scope.confirmation = true;

        //Clear the fields
        $scope.first= "";
        $scope.last = "";
        $scope.id = "";
        $scope.skill = false;
    };
*/
}]);