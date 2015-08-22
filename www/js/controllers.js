angular.module('starter.controllers', ['ngCordova'])

// .controller('DashCtrl', function($scope) {})
//
// .controller('ChatsCtrl', function($scope, Chats) {
//   // With the new view caching in Ionic, Controllers are only called
//   // when they are recreated or on app start, instead of every page change.
//   // To listen for when this page is active (for example, to refresh data),
//   // listen for the $ionicView.enter event:
//   //
//   //$scope.$on('$ionicView.enter', function(e) {
//   //});
//
//   $scope.chats = Chats.all();
//   $scope.remove = function(chat) {
//     Chats.remove(chat);
//   };
// })
//
// .controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
//   $scope.chat = Chats.get($stateParams.chatId);
// })

.controller('AccountCtrl', function($scope, $ionicModal, $ionicLoading, Commons) {
  $scope.registration = {};
  $scope.config = {
    SMSServer: Commons.SMSServer(),
    APIServer: Commons.APIServer()
  };

  $scope.init = function() {
    $scope.registration = Commons.userInfo();
  }

  $scope.$on('$ionicView.beforeLeave', function() {
    if ($scope.config.SMSServer != Commons.SMSServer() || $scope.config.APIServer != Commons.APIServer()) {
      if (confirm('Simpan konfigurasi?')) {
        Commons.updateSMSServer($scope.config.SMSserver);
        Commons.updateAPIServer($scope.config.APIServer);
      }
    }
  });

  $ionicModal.fromTemplateUrl('register-modal.html', {
   scope: $scope,
   animation: 'slide-in-up'
  }).then(function(modal) {
   $scope.modal = modal
  })

 $scope.openModal = function() {
   $scope.modal.show()
 }

 $scope.closeModal = function() {
   $scope.modal.hide();
 };

 $scope.register = function() {
   Commons.updateUserInfo($scope.registration);
   $scope.modal.hide();
 };

 $scope.$on('$destroy', function() {
   $scope.modal.remove();
 });

})

/* Cek Harga! */

.controller('CekHargaCtrl', function($scope, $ionicLoading, $cordovaSms, $ionicPlatform, Commons, Webservice) {

  // set options
  $scope.items = Commons.items();
  $scope.sellers = Commons.sellers();
  $scope.selection = {
    item: ($scope.items.length > 0) ? $scope.items[0].code : null,
    seller: ($scope.sellers.length > 0) ? $scope.sellers[0].code : null
  };
  $scope.currentPosition = null;

  $scope.onPositionFound = function(position) {
    $scope.currentPosition = position;
    var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: $scope.map,
      title: 'Posisi Anda (' + position.coords.latitude + ', ' +  position.coords.longitude + ')'
    });
    var infowindow = new google.maps.InfoWindow({
      content: marker.title
    }).open($scope.map, marker);
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open($scope.map,marker);
    });
    $scope.map.setCenter(myLatlng);
  }

  $scope.onPositionError = function(err) {
    alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
  }

  $scope.getUserCurrentLocation = function(options) {
    navigator.geolocation.getCurrentPosition($scope.onPositionFound,
      function(err) {
        options.enableHighAccuracy = true; // force to use GPS
        navigator.geolocation.getCurrentPosition($scope.onPositionFound, $scope.onPositionError, options);
      },
      options);
    }

    $scope.init = function() {
      $scope.map = new google.maps.Map(document.getElementById("map"), {zoom: 16,mapTypeId: google.maps.MapTypeId.ROADMAP});
      $scope.getUserCurrentLocation(
        {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false}
      );
    }

    // in case position was not found, try it again on view re-enter
    $scope.$on('$ionicView.enter', function() {
      if ($scope.map && !$scope.currentPosition) {
        $scope.init();
      }
    });

    $scope.getPrice = function(source) {
      if ($scope.selection.item && $scope.selection.seller) {
        $ionicLoading.show();
        if ('WEB' == source) {
          Webservice.example(
            {barang:$scope.selection.item, penjual:$scope.selection.seller},
            function(res) {
              alert(JSON.stringify(res));
              $ionicLoading.hide();
            },
            function(err) {
              alert(err);
              $ionicLoading.hide();
            }
          );
        } else if ('SMS' == source) {
          var phonenumber = Commons.SMSServer();
          var content = 'CEKHARGA ' + $scope.selection.item.toUpperCase() + ' ' + $scope.selection.seller.toUpperCase();
          alert(content);
          try {
            $ionicPlatform.ready(function() {
              $cordovaSms
              .send(phonenumber, content)
              .then(function() {
                alert('SMS berhasil dikirim')
                $ionicLoading.hide();
              }, function(error) {
                alert('SMS gagal dikirim: ' + error);
                $ionicLoading.hide();
              });
            });
          } catch(err) {
            alert(err);
            $ionicLoading.hide();
          }
        }
      }
    }

  })

  .controller('PosHargaCtrl', function($scope, $ionicLoading, $ionicPlatform, Commons, Webservice) {
    // set options
    $scope.items = Commons.items();
    $scope.sellers = Commons.sellers();
    $scope.selection = {
      item: ($scope.items.length > 0) ? $scope.items[0].code : null,
      seller: ($scope.sellers.length > 0) ? $scope.sellers[0].code : null,
      price: null
    };
    $scope.source = null;
    $scope.currentPosition = null;
    $scope.markers = [];

    $scope.sendPrice = function(source) {
      $scope.source = source;
      if ('WEB' == $scope.source) {
        var content = {barang: $scope.selection.item, harga: $scope.selection.price, lat: $scope.currentPosition.lat(), lng: $scope.currentPosition.lng()};
        alert(content);
        $ionicLoading.show();
        Webservice.example(
          content,
          function(res) {
            alert(JSON.stringify(res));
            $ionicLoading.hide();
          },
          function(err) {
            alert(err);
            $ionicLoading.hide();
          }
        );
      } else if ('SMS' == $scope.source) {
        var phonenumber = Commons.SMSServer();
        var content = 'POSHARGA,' + $scope.selection.item.toUpperCase() + ',' + $scope.selection.price + ',' + $scope.currentPosition.lat() + ',' + $scope.currentPosition.lng();
        alert(content);
        // $ionicLoading.show();
        // try {
        //   $ionicPlatform.ready(function() {
        //     $cordovaSms
        //     .send(phonenumber, content)
        //     .then(function() {
        //       alert('SMS berhasil dikirim')
        //       $ionicLoading.hide();
        //     }, function(error) {
        //       alert('SMS gagal dikirim: ' + error);
        //       $ionicLoading.hide();
        //     });
        //   });
        // } catch(err) {
        //   alert(err);
        //   $ionicLoading.hide();
        // }
      }
      //var options = {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false};
      // navigator.geolocation.getCurrentPosition(
      //   $scope.onPositionFound,
      //   function(err) {
      //     options.enableHighAccuracy = true; // force native GPS
      //     navigator.geolocation.getCurrentPosition(
      //       $scope.onPositionFound,
      //       $scope.onPositionError,
      //       options
      //     );
      //   },
      //   options);
      }

      // $scope.onPositionFound = function(pos) {
      //   if ('WEB' == $scope.source) {
      //     Webservice.example(
      //       {barang: $scope.selection.item, penjual: $scope.selection.seller, harga: $scope.selection.price, lat: pos.coords.latitude, lng: pos.coords.longitude},
      //       function(res) {
      //         alert(JSON.stringify(res));
      //         $ionicLoading.hide();
      //       },
      //       function(err) {
      //         alert(err);
      //         $ionicLoading.hide();
      //       }
      //     );
      //   } else if ('SMS' == $scope.source) {
      //     var phonenumber = Commons.SMSServer();
      //     var content = 'POSHARGA ' + $scope.selection.item.toUpperCase() + ' ' + $scope.selection.seller.toUpperCase() + ' ' + $scope.selection.price + ' ' + pos.coords.latitude + ' ' + pos.coords.longitude;
      //     alert(content);
      //     $ionicLoading.show();
      //     try {
      //       $ionicPlatform.ready(function() {
      //         $cordovaSms
      //         .send(phonenumber, content)
      //         .then(function() {
      //           alert('SMS berhasil dikirim')
      //           $ionicLoading.hide();
      //         }, function(error) {
      //           alert('SMS gagal dikirim: ' + error);
      //           $ionicLoading.hide();
      //         });
      //       });
      //     } catch(err) {
      //       alert(err);
      //       $ionicLoading.hide();
      //     }
      //   }
      // }

      $scope.onPositionError = function(err) {
        alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
        $ionicLoading.hide();
      }

      $scope.onPositionFound = function(position) {
        $scope.currentPosition = position;
        var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: $scope.map,
          title: 'Posisi Anda (' + position.coords.latitude + ', ' +  position.coords.longitude + ')'
        });
        var infowindow = new google.maps.InfoWindow({
          content: marker.title
        }).open($scope.map, marker);
        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open($scope.map,marker);
        });
        $scope.map.setCenter(myLatlng);
        $scope.markers.push(marker);
      }

      $scope.getUserCurrentLocation = function(options) {
        navigator.geolocation.getCurrentPosition($scope.onPositionFound,
          function(err) {
            options.enableHighAccuracy = true; // force to use GPS
            navigator.geolocation.getCurrentPosition($scope.onPositionFound, $scope.onPositionError, options);
          },
          options);
        }

        $scope.init = function() {
          $scope.map = new google.maps.Map(document.getElementById("map"), {zoom: 16,mapTypeId: google.maps.MapTypeId.ROADMAP});
          $scope.getUserCurrentLocation(
            {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false}
          );

          // on map click
          google.maps.event.addListener($scope.map, 'click', function(e) {
            $scope.clearMarkers();
      			$scope.currentPosition = e.latLng;
            var marker = new google.maps.Marker({
              position: $scope.currentPosition,
              map: $scope.map,
              title: 'Posisi (' + $scope.currentPosition.lat() + ', ' +  $scope.currentPosition.lng() + ')'
            });
            var infowindow = new google.maps.InfoWindow({
              content: marker.title
            }).open($scope.map, marker);
            $scope.markers.push(marker);
      		});

        }

        $scope.clearMarkers = function() {
      		for ( var i = 0; i < $scope.markers.length; i++) {
      			$scope.markers[i].setMap(null);
      		}
          $scope.markers = [];
      	}

        // in case position was not found, try it again on view re-enter
        $scope.$on('$ionicView.enter', function() {
          if ($scope.map && !$scope.currentPosition) {
            $scope.init();
          }
        });
    })

    .controller('JualCtrl', function($scope, $ionicLoading, $ionicPlatform, Commons, Webservice) {
      // set options
      $scope.items = Commons.items();
      $scope.sellers = Commons.sellers();
      $scope.selection = {
        item: ($scope.items.length > 0) ? $scope.items[0].code : null,
        seller: ($scope.sellers.length > 0) ? $scope.sellers[0].code : null,
        price: null
      };
      $scope.source = null;
      $scope.currentPosition = null;
      $scope.loggedIn = true; // TODO call API

      $scope.sendPrice = function(source) {
        if (source && $scope.selection.item && $scope.selection.seller && $scope.selection.item) {
          $scope.source = source;
          $ionicLoading.show();
          var options = {maximumAge: 30000, timeout: 20000, enableHighAccuracy: false};
          navigator.geolocation.getCurrentPosition(
            $scope.onPositionFound,
            function(err) {
              options.enableHighAccuracy = true; // force native GPS
              navigator.geolocation.getCurrentPosition(
                $scope.onPositionFound,
                $scope.onPositionError,
                options
              );
            },
            options);
          }
        }

        $scope.onPositionFound = function(pos) {
          if ('WEB' == $scope.source) {
            Webservice.example(
              {barang: $scope.selection.item, penjual: $scope.selection.seller, harga: $scope.selection.price, lat: pos.coords.latitude, lng: pos.coords.longitude},
              function(res) {
                alert(JSON.stringify(res));
                $ionicLoading.hide();
              },
              function(err) {
                alert(err);
                $ionicLoading.hide();
              }
            );
          } else if ('SMS' == $scope.source) {
            var phonenumber = Commons.SMSServer();
            var content = 'POSHARGA ' + $scope.selection.item.toUpperCase() + ' ' + $scope.selection.seller.toUpperCase() + ' ' + $scope.selection.price + ' ' + pos.coords.latitude + ' ' + pos.coords.longitude;
            alert(content);
            $ionicLoading.show();
            try {
              $ionicPlatform.ready(function() {
                $cordovaSms
                .send(phonenumber, content)
                .then(function() {
                  alert('SMS berhasil dikirim')
                  $ionicLoading.hide();
                }, function(error) {
                  alert('SMS gagal dikirim: ' + error);
                  $ionicLoading.hide();
                });
              });
            } catch(err) {
              alert(err);
              $ionicLoading.hide();
            }
          }
        }

        $scope.onPositionError = function(err) {
          alert('Lokasi tidak berhasil dideteksi : ' + err.message + ' (' + err.code + ')');
          $ionicLoading.hide();
        }

      })

    ;
