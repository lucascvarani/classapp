var csv = require('csv');
const fs = require('fs');
const regexpTree = require('regexp-tree');
var obj = csv();
// Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var validator = require("email-validator");

var list = [];

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function filterArray(array){
  /*This function remove repeted elements of the array*/
  var newArray = [];
  var inArray;
  for(var i = 0; i < array.length; i++){
    inArray = newArray.indexOf(array[i])
    if(inArray == -1){
      newArray.push(array[i])
    }
  }
  return newArray;
}

function FullName(dict, content){
  if(!('fullname' in dict)){
    dict['fullname'] = content
  }
}

function eID(dict, content){
  dict['eid'] = content
}

function Invisible(dict,content){
  if(content == '1' || content == 'yes'){
    dict['invisible'] = true
  }

  if(content == '0' || content == 'no'){
    dict['invisible'] = false
  }

  if(content == ''){
    if(!('invisible' in dict)){
      dict['invisible'] = false
    }
  }
}

function See_all(dict,content){

    if(content == 'yes' || content == '1'){
      dict['see_all'] = true
    }
    if(content == 'no' || content == '' || content == '0'){
      dict['see_all'] = false
    }

    if(content == ''){
      if(!('see_all' in dict)){
        dict['see_all'] = false
      }
    }
}

function Classes(dict,content){
    /*This function receive the main dictionary and the content of column's class*/
    content = content.replace(',','/')
    content = replaceAll(content,',','/')
    content = replaceAll(content,' /','/')
    content = replaceAll(content,'/ ','/')


    content = content.split('/')

    if(content != ''){
      if(!('classes' in dict)){
        if(content.length > 1){
          dict['classes'] = content
          dict['classes'] = filterArray(dict['classes'])
        }
        else{
          dict['classes'] = content[0]
        }
      }
      else{
        if(Array.isArray(dict['classes'])){
          dict['classes'] = dict['classes'].concat(content)
          dict['classes'] = filterArray(dict['classes'])
        }
        else{
          dict['classes'] = [dict['classes']]
          dict['classes'] = dict['classes'].concat(content)
          dict['classes'] = filterArray(dict['classes'])
        }
      }
    }
}

function Phone(dict, text,content){
  /*This function receive the dictionary, the text with the tags of this column and the content of this line and column*/

  var equal = false /*Variable who indique if the email alredy exist on the main dictionary*/
  text = text.replace("phone ","")
  text = replaceAll(text,' ','')
  tags = text.split(",") /*Separation of the tags*/

  content = replaceAll(content,',','/')
  content = content.split('/')
  for( var i=0;i < content.length;i++){
    equal = false
    var content_number = ''
    /*It verify if it is a valid phone number*/
    try {
      const number = phoneUtil.parseAndKeepRawInput(content[i], 'BR');
      if(phoneUtil.isPossibleNumber(number)){
        if(phoneUtil.isValidNumber(number)){
          content_number = phoneUtil.formatOutOfCountryCallingNumber(number, 'PT/BR');
          content_number = content_number.replace('+','')
          content_number = content_number.replace('-','')
          content_number = replaceAll(content_number,' ','')
        }
      }
    }
    catch(err) {
      //NOT A NUMBER
    }

    dict_phone = {
      "type" : "phone",
      "tags" : tags,
      "adress" : content_number
    }

    if(content_number != ''){
      if(!('adresses' in dict)){
        dict["adresses"] = [dict_phone]
      }

      else{
        for(var j = 0;j < dict["adresses"].length; j++){
          if(dict["adresses"][j]["adress"] == content_number){
            equal = true
            dict["adresses"][j]["tags"] = dict["adresses"][j]["tags"].concat(tags)
          }
        }
        if(equal == false){
          dict["adresses"].push(dict_phone)
        }
      }
    }
  }
}

function Email(dict, text,content){
  /*This function receive the dictionary, the text with the tags of this column and the content of this line and column*/

  var equal = false /*Variable who indique if the email alredy exist on the main dictionary*/
  text = text.replace("email ","")
  text = replaceAll(text,' ','')
  tags = text.split(",") /*Separation of the tags*/

  content = replaceAll(content,',','/')
  content = content.split('/') /*Separation of the emails*/

  for(var i = 0; i < content.length; i++){
    equal = false

    if(validator.validate(content[i])){
      var dict_email = {
        "type" : "email",
        "tags" : tags,
        "adress" : content[i]
      }

      if(content[i] != ''){
        if(!('adresses' in dict)){
          dict["adresses"] = [dict_email]
        }
        else{
          for(var j = 0;j < dict["adresses"].length; j++){
            if(dict["adresses"][j]["adress"] == content[i]){
              equal = true
              dict["adresses"][j]["tags"] = dict["adresses"][j]["tags"].concat(tags)
            }
          }
          if(equal == false){
            dict["adresses"].push(dict_email)
          }
        }
      }
    }
  }
}



obj.from.path('input.csv').to.array(function (data) {
var columns = data[0]

/*-----------------------------------------------------------------------------------
Here I save the index of eid column, I have to do it to know who are the same people
------------------------------------------------------------------------------------*/
for (var j = 0; j< columns.length; j++){
  if(columns[j].search('eid') != -1){
    var j_id = j
  }
}
/*------------------------------------------------------------------------------------*/


var dict_ids = {}; /*It's a hash for ids. It saves the existents dictionarys with id as key*/
var dict = {}; /*It's the main dictionary*/
var inList = -1;

for (var i = 1; i< data.length; i++){ /*This For go through the lines of csv file*/
  /*If this id is already on the dict_ids, I don't have to create another dictionary, I have to modify the existent dictionary*/
  if(data[i][j_id] in dict_ids){
    dict = dict_ids[data[i][j_id]] /*Empty dictionary now is the exitent dictionary*/
    inList = list.indexOf(dict_ids[data[i][j_id]]) /*Save the position of dictionary on list*/
  }
    for (var j = 0; j< columns.length; j++){ /*This For go through the columns of csv file*/

        /*--------------------------------------------------
          Now, for each column's name I have to do something
        ----------------------------------------------------*/

        if(columns[j].search('fullname') != -1){
          FullName(dict,data[i][j])
        }

        if(columns[j].search('eid') != -1){
          eID(dict,data[i][j])
        }

        if(columns[j].search('see_all') != -1){
          See_all(dict,data[i][j])
        }

        if(columns[j].search('invisible') != -1){
          Invisible(dict,data[i][j])
        }

        if(columns[j].search('class') != -1){
          Classes(dict,data[i][j])
        }

        if(columns[j].search('phone') != -1){
          Phone(dict,columns[j],data[i][j])
        }

        if(columns[j].search('email') != -1){
          Email(dict,columns[j],data[i][j])
        }
    }
    /*----------------------------------------------*/


    dict_ids[data[i][j_id]] = dict
    if(inList == -1){ /*Object is not in list*/
      list.push(dict);
      }
    else{
      list[inList] = dict
    }
    inList = -1
    dict = {}
}

  const jsonString = JSON.stringify(list)
  //console.log(jsonString)
  fs.writeFile('./output.json', jsonString, err => {
      if (err) {
          console.log('Error writing file', err)
      } else {
          console.log('Successfully wrote file')
      }
  })
});
