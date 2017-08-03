/**
 * Created by bjwsl-001 on 2017/6/9.
 */

var app = angular.module('kfl', ['ng', 'ngRoute']);

app.factory('$debounce', ['$rootScope', '$browser', '$q', '$exceptionHandler',
  function($rootScope, $browser, $q, $exceptionHandler) {
    var deferreds = {},
      methods = {},
      uuid = 0;

    function debounce(fn, delay, invokeApply) {
      var deferred = $q.defer(),
        promise = deferred.promise,
        skipApply = (angular.isDefined(invokeApply) && !invokeApply),
        timeoutId, cleanup,
        methodId, bouncing = false;

      // check we dont have this method already registered
      angular.forEach(methods, function(value, key) {
        if (angular.equals(methods[key].fn, fn)) {
          bouncing = true;
          methodId = key;
        }
      });

      // not bouncing, then register new instance
      if (!bouncing) {
        methodId = uuid++;
        methods[methodId] = { fn: fn };
      } else {
        // clear the old timeout
        deferreds[methods[methodId].timeoutId].reject('bounced');
        $browser.defer.cancel(methods[methodId].timeoutId);
      }

      var debounced = function() {
        // actually executing? clean method bank
        delete methods[methodId];

        try {
          deferred.resolve(fn());
        } catch (e) {
          deferred.reject(e);
          $exceptionHandler(e);
        }

        if (!skipApply) $rootScope.$apply();
      };

      timeoutId = $browser.defer(debounced, delay);

      // track id with method
      methods[methodId].timeoutId = timeoutId;

      cleanup = function(reason) {
        delete deferreds[promise.$$timeoutId];
      };

      promise.$$timeoutId = timeoutId;
      deferreds[timeoutId] = deferred;
      promise.then(cleanup, cleanup);

      return promise;
    }


    // similar to angular's $timeout cancel
    debounce.cancel = function(promise) {
      if (promise && promise.$$timeoutId in deferreds) {
        deferreds[promise.$$timeoutId].reject('canceled');
        return $browser.defer.cancel(promise.$$timeoutId);
      }
      return false;
    };

    return debounce;
  }
]);

app.config(function ($routeProvider) {
  $routeProvider
    .when('/kflStart', {
      templateUrl: 'tpl/start.html'
    })
    .when('/kflMain', {
      templateUrl: 'tpl/main.html',
      controller: 'MainCtrl'
    })
    .when('/kflDetail/:id', {
      templateUrl: 'tpl/detail.html',
      controller: 'DetailCtrl'
    })
    .when('/kflOrder/:id', {
      templateUrl: 'tpl/order.html',
      controller: 'OrderCtrl'
    })
    .when('/kflMyOrder', {
      templateUrl: 'tpl/myOrder.html',
      controller: 'MyOrderCtrl'
    })
    .otherwise({redirectTo: '/kflStart'})
})

app.controller('parentCtrl',
  ['$scope', '$location',
    function ($scope, $location) {
      $scope.jump = function (desPath) {
        $location.path(desPath);
      }
    }
  ])

app.controller('MainCtrl',
  ['$scope', '$http','$debounce',
  function ($scope, $http,$debounce) {
    //定义一个空的字符串，存储搜索时用户输入的内容
    $scope.kw = '';
    //定义一个布尔类型的标志位
    $scope.hasMore = true;
    //发起请求拿菜品列表 并绑定到视图去显示
    $http
      .get('data/dish_getbypage.php')
      .success(function (data) {
        //  console.log(data);
        $scope.dishList = data;
      });

    //加载更多数据
    $scope.loadMore = function () {
      $http
        .get('data/dish_getbypage.php?start=' +
        $scope.dishList.length)
        .success(function (data) {
          if (data.length < 5) {
            $scope.hasMore = false;
          }
          //将返回的新的数组 和 之前的dishList拼接
          //比如本来：[1,2,3],返回[4,5]--> 【1,2,3,4,5】
          $scope.dishList =
            $scope.dishList.concat(data);
        })
    }

    var handler = function(){
      $http
        .get('data/dish_getbykw.php?kw=' + $scope.kw)
        .success(function (data) {
          //console.log('查询结果为', data);
          if (data.length > 0) {
            //将data数组中数据显示在视图中
            $scope.dishList = data;
          }
        })
    }

    //监听kw模型数据变化
    $scope.$watch('kw', function () {
      console.log($scope.kw);
      //向服务器端发起请求进行关键字查询
      if ($scope.kw.length > 0) {
        //$debonce去调用handler
        $debounce(handler,300);
        //handler();
      }

    });
  }
])

app.controller('DetailCtrl',
  ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {
      var did = $routeParams.id;
      //console.log(did);
      $http
        .get('data/dish_getbyid.php?id=' + did)
        .success(function (data) {
          // console.log(data);
          $scope.dish = data[0];
        })
    }
  ])

app.controller('OrderCtrl',
  ['$scope', '$http', '$routeParams', '$httpParamSerializerJQLike',
    function ($scope, $http, $routeParams, $httpParamSerializerJQLike) {
      //console.log($routeParams);
      $scope.order = {did: $routeParams.id};
      $scope.submitOrder = function () {
        console.log($scope.order);
        //针对 对象或者数组 做序列化的处理
        var result = $httpParamSerializerJQLike($scope.order);
        $http
          .get('data/order_add.php?' + result)
          .success(function (data) {
            console.log(data);
            if (data[0].msg == 'succ') {
              $scope.AddResult = '下单成功，订单编号为' + data[0].oid;
              sessionStorage.setItem('phone',
                $scope.order.phone)
            }
            else {
              $scope.AddResult = "下单失败";
            }

          })
      }
    }
  ]);

app.controller('MyOrderCtrl', ['$scope', '$http',
  function ($scope, $http) {
    //根据手机号 读取 该手机号对应的订单信息
    var phone = sessionStorage.getItem('phone');
    $http
      .get('data/order_getbyphone.php?phone=' + phone)
      .success(function (data) {
        console.log(data);
        $scope.orderList = data;
      })
  }
])


