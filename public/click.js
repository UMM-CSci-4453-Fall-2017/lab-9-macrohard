angular.module('register',[])
  .controller('registerCtrl',RegisterCtrl)
  .factory('registerApi',registerApi)
  .constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!

function RegisterCtrl($scope,registerApi){
   $scope.totalCost=totalCost;
   $scope.buttons=[]; //Initially all was still
   $scope.order=[];
   $scope.users=[];
   $scope.errorMessage='';
   $scope.isLoading=isLoading;
   $scope.refreshButtons=refreshButtons;
   $scope.buttonClick=buttonClick;
   $scope.orderID = 0;
   $scope.removePurchase=removePurchase;
   $scope.completeTransaction=completeTransaction;
   $scope.voidTransaction=voidTransaction;
   $scope.personLoggedIn=personLoggedIn;
   $scope.firstname="";
   $scope.lastname="";
   $scope.finalCost=0;
   $scope.addNewUser=addNewUser;
   $scope.receiptNumber=1;
   $scope.logOut=logOut;

   var loading = false;

   function isLoading(){
    return loading;
   }

  function refreshButtons(){
    loading=true;
    $scope.errorMessage='';
    registerApi.getButtons()
      .success(function(data){
         $scope.buttons=data;
         loading=false;
      })
      .error(function () {
          $scope.errorMessage="Unable to load Buttons:  Database request failed";
          loading=false;
      });
  }
 
 
  //checks credentials against the list of allowed users to let 
  function personLoggedIn() {
	$scope.errorMessage='';
	  loading = true;
	  var loggedIn = false; 

	registerApi.logIn($scope.username, $scope.password)
	  .success(function(data){
		if(data.length == 1){
			$scope.personLoggedIn = $scope.username;
			loggedIn = true;
			loading = false;
		}
	  })
	  .error(function(){
		$scope.errorMessage="error loading users: Database request failed";
		  loading = false;
	  });

	  if(!loggedIn){
		$scope.personLoggedIn = "Please Log In";
	  }
  }

  function logOut() {
	$scope.personLoggedIn = "Please Log In";
  }

	//if a button is clicked that isn't a special case, it will perform it's intended action
  function buttonClick($event){
     $scope.errorMessage='';
	  if($event.target.id == -1){
		personLoggedIn();
	  } else if ($event.target.id == -2 && $scope.personLoggedIn != "Please Log In"){
		addNewUser();
	  } else {
		 if ($scope.personLoggedIn != "Please Log In") {
			refreshItems($event.target);
		  }
	  }
  }

  function addNewUser(){
	  $scope.errorMessage='';
	  loading = true;

	registerApi.checkName($scope.username)
          .success(function(data){
                if(data.length == 0){
			registerApi.addNewUser($scope.username, $scope.password)
				.success(function(){
					loading = false;
				})
				.error(function(){
					$scope.errorMessage="error loading users: Database request failed - couldn't add user";
					loading=false;
				});
                }
          })
          .error(function(){

                $scope.errorMessage="error loading users: Database request failed - couldn't check username";
                  loading = false;
          });
  }

  //updates the order by adding new items if needed, or updating the quantity of existing items
  function refreshItems(target){ 
 	$scope.errorMessage='';
	  var alreadyHasItem = false;

	  for(items in $scope.order){
		if(target.id == $scope.order[items].invID){
			$scope.order[items].quantity++;
			$scope.order[items].lastTime = Date.now();
			alreadyHasItem = true;

		}
	  }

	  var newItemPrice;
	  var newItemLabel;
	  for(button in $scope.buttons){
		if((target.id-1) == button){
			newItemPrice = $scope.buttons[button].prices;
			newItemLabel = $scope.buttons[button].label;
		}
	  }



	  if(!alreadyHasItem){
		  $scope.order.push({"buttonID":$scope.orderID,"invID":target.id,"quantity":1,"prices":newItemPrice,"label":newItemLabel,"top":(($scope.order.length)*50)+150,"firstTime":Date.now(),"lastTime":Date.now()})
		  $scope.orderID++;
	  }
   	  totalCost(); 
  }

	//calculates the total cost and formats it to 2 decimal places
  function totalCost(){
	  var cost = 0;
	for(items in $scope.order){
		for(button in $scope.buttons){
			if(items.invID == button.invID){	
				cost = cost + ($scope.order[items].quantity * $scope.buttons[button].prices);
			}
		}
	}
	$scope.finalCost = cost.toFixed(2);
	$scope.totalCost = cost.toFixed(2);

  }

	//removes an item if it's button is clicked in the current transaction area
  function removePurchase($event){

	$scope.errorMessage='';
	var itemRemoved = false;
	for (items in $scope.order) {


		if ($scope.order[items].invID == $event.target.id) {
			$scope.order[items].quantity--;
			if ($scope.order[items].quantity == 0)
			{
				$scope.order.splice(items, 1);
				itemRemoved = true;
			}
		}
	}
	  if(itemRemoved){
		for(items in $scope.order){
			$scope.order[items].top=((items)*50)+150;
		}
	  }
  	totalCost();
  }

	//completes the transaction and sends its relevant information to the database (updating till_inventory's amount and adding rows to till_sales)
  function completeTransaction() {

	  var firstButton = $scope.order[0].firstTime;
	  var didsomething = false;
	  var buttonPushed = Date.now();
	$scope.receiptNumber=(Date.now() + Math.floor(Math.random() * 1000000));
	for (item in $scope.order)
	  {
		  didsomething = true;
		  if($scope.order[item].firstTime < firstButton){
			firstButton = $scope.order[item].firstTime;
		  }
		registerApi.updateInventory($scope.order[item].invID, $scope.order[item].quantity,$scope.receiptNumber, $scope.personLoggedIn, $scope.order[item].firstTime, $scope.order[item].lastTime, $scope.finalCost)
			.success(function(data){
 	
      			})
		      .error(function () {
          			$scope.errorMessage="Unable to load Users:  Database request failed";
		      });

	  }
	  if(didsomething){
		registerApi.updateInventory(-1, -1, $scope.receiptNumber, $scope.personLoggedIn, firstButton, buttonPushed, $scope.finalCost);
	  	receiptPopup();
		  voidTransaction();
	  }
  }

	//voids the current transaction
  function voidTransaction() {
	$scope.order = [];
	  $scope.orderID = 0;
	  totalCost();
  }

  function receiptPopup() {
	var itemHolder = [];
	var tempItem = "";

	  for(item in $scope.order){
		tempItem = $scope.order[item].label+'\t-\t'+$scope.order[item].quantity;
		  itemHolder[item] = tempItem;
	  }
	  itemHolder[itemHolder.length+1] = "Total Cost: $"+$scope.finalCost;
	  alert(itemHolder.join("\n"));
  }
	refreshButtons();  //make sure the buttons are loaded
	totalCost();  //make sure the total cost is initialized
	personLoggedIn();
}

function registerApi($http,apiUrl){
  return{
    getButtons: function(){
      var url = apiUrl + '/buttons';
      return $http.get(url);
    },
    updateInventory: function(invID, quantity, receiptNumber, user, firstTime, lastTime, finalCost)
	  {
		var url = apiUrl + '/update?invID='+invID+'&quantity='+quantity+'&receiptNumber='+receiptNumber+'&user='+user+'&firstTime='+firstTime+'&lastTime='+lastTime+'&finalCost='+finalCost;
		return $http.get(url);
	  },
	  logIn: function(username, password) {
		var url = apiUrl + '/login?username='+username+'&password='+password;
		return $http.get(url);
	  },
	  checkName: function(username) {
		var url = apiUrl + '/checkName?username='+username;
		  return $http.get(url);
	  },
	  addNewUser: function(username, password){
		var url = apiUrl + '/addNewUser?username='+username+'&password='+password;
                return $http.get(url);
	  }
 };
}
