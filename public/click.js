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
   $scope.receiptNumber=1;

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
 
  //gets the list of cashiers from the database
  function refreshUsers(){
    loading=true;
    $scope.errorMessage='';
    registerApi.getUsers()
      .success(function(data){
         $scope.users=data;
         loading=false;
      })
      .error(function () {
          $scope.errorMessage="Unable to load Users:  Database request failed";
          loading=false;
      });
  }
 
  //checks credentials against the list of allowed users to let 
  function personLoggedIn() {
	$scope.errorMessage='';
	  refreshUsers();
	  var loggedIn = false; 
	for (usernames in $scope.users)
	  {
		if ($scope.users[usernames].Firstname == $scope.firstname && $scope.users[usernames].Lastname == $scope.lastname)
		  {
			$scope.personLoggedIn = $scope.firstname + " " + $scope.lastname;
			  loggedIn = true;
		  }
	  }

	  if(!loggedIn){
		$scope.personLoggedIn = "No One";
	  }
  }

	//if a button is clicked that isn't a special case, it will perform it's intended action
  function buttonClick($event){
     $scope.errorMessage='';
	  if($event.target.id == -1){
		personLoggedIn();
	  } else {
		refreshItems($event.target);
	  }
    // registerApi.clickButton($event.target.id)
      //  .success(refreshItems($event.target.id))
        //.error(function(){$scope.errorMessage="Unable to click";});
  }
  //updates the order by adding new items if needed, or updating the quantity of existing items
  function refreshItems(target){ 
 	$scope.errorMessage='';
	  var alreadyHasItem = false;

	  for(items in $scope.order){
		if(target.id == $scope.order[items].invID){
			$scope.order[items].quantity++;
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
		  $scope.order.push({"buttonID":$scope.orderID,"invID":target.id,"quantity":1,"prices":newItemPrice,"label":newItemLabel,"top":(($scope.order.length)*50)+150})
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
	$scope.totalCost = cost.toFixed(2);

  }
  function itemCost(){
	//not implemented
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

	  var didsomething = false;
	for (item in $scope.order)
	  {
		  didsomething = true;
		registerApi.updateInventory($scope.order[item].invID, $scope.order[item].quantity,$scope.receiptNumber)
			.success(function(data){
 	
      			})
		      .error(function () {
          			$scope.errorMessage="Unable to load Users:  Database request failed";
		      });

	  }
	  if(didsomething){
		$scope.receiptNumber++;
	  	voidTransaction();
	  }
  }
	//voids the current transaction
  function voidTransaction() {
	$scope.order = [];
	  $scope.orderID = 0;
	  totalCost();
  }
  
	refreshButtons();  //make sure the buttons are loaded
  	refreshUsers();  //make sure the users are loaded
	totalCost();  //make sure the total cost is initialized

}

function registerApi($http,apiUrl){
  return{
    getButtons: function(){
      var url = apiUrl + '/buttons';
      return $http.get(url);
    },
    clickButton: function(id){
      var url = apiUrl+'/click?id='+id;
      return $http.post(url); // Easy enough to do this way
    },
    getUsers: function(){
      var url = apiUrl + '/user';
      return $http.get(url);
    },
    updateInventory: function(invID, quantity, receiptNumber)
	  {
		var url = apiUrl + '/update?invID='+invID+'&quantity='+quantity+'&receiptNumber='+receiptNumber;
		return $http.get(url);
	  }
 };
}
