   var username;
   var descriptiontext = "\n\n";
   var caller_id;
   var number;
   var caller_box = document.getElementById("sys_display.incident.caller_id");
   var company_box = document.getElementById("sys_display.incident.company");
   var employeenumber_box = document.getElementById('incident.caller_id.employee_number');
   var description_box = document.getElementById("incident.description");
   var telephonenumber_box = document.getElementById("incident.u_phone_number");
   var computername_box = document.getElementById("incident.u_computer_name");
   let url = new URL(window.document.location); // or construct from window.location

   let params = new URLSearchParams(url.search.slice(1));
   
   

   extracturlinfo(); // hämtar info från url
   pageload(); //när sidan startar upp första gången
   usernamechange(); //uppdaterar datornamn när användaren ändrar username
   


   function extracturlinfo()
   {
   for (let p of params) {
    if(p.includes("CallerID")) { caller_id = p[1] };
    if(p.includes("Number")) { number = p[1] };
   }
   }

   function pageload(){
    if(caller_id != null)
    {   
    caller_box.value=caller_id.split("_").join(" ");
    description_box.focus();   
    }
    if(number != null)
    {
    description_box.value= `Användarnamn:\nDatornamn:\nPlats:\nTelefonnummer: ${number} \n\nProblembeskrivning:\n\n`;
    telephonenumber_box.value=number      
   }
   setTimeout(function() {
      UpdateDescription(); 
   }, 2000); 
}
   
   function usernamechange(){
   setInterval(function() {
      if(username != employeenumber_box.value && username != null)
      {
         descriptiontext = description_box.value;
         descriptiontext = descriptiontext.substring(descriptiontext.lastIndexOf("Plats:") + 6)
         UpdateDescription();
      }
      }, 250);
      username = employeenumber_box.value;
   }
   


   function UpdateDescription(){
      setTimeout(function(){
      chrome.runtime.sendMessage({username: employeenumber_box.value, organization: company_box.value}, function(response) {
            description_box.value= `Användarnamn:\nDatornamn: ${response.farewell}\nPlats:${descriptiontext}`;              
       });
      }, 250);  
      username = employeenumber_box.value;
  }

    
   
