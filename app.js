const express = require('express');
const bodyParser = require('body-parser');
//const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-adeline:Test123@cluster0.aivci.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todo list!'
});

const item2 = new Item({
  name: 'Hit the + button to add new item.'
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/', function(req, res) {
  //  const day = date.getDate();
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
          res.redirect("/");
        } else {
          console.log("Default items saved successfully!");
          res.redirect("/");
        }
      });
    } else {
      res.render('list', {listTitle: "Today", newListItems: items});
    }
  });

});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/' + listName);
    });
  }

});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (error) => {
      if (!error) {
        console.log(`${checkedItemId} was removed from the database`);
      }
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate({ name: listName }, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName}, (err, foundList) => {
    if (!err) {
      if (foundList) {
        console.log(`${customListName} already exists`);
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        console.log(`Creating db entry for ${customListName}`);
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      }
    }
  });
});

app.get('/about', function(req, res) {
  res.render('about');
});

let port = process.env.PORT;

if (port == null || port == '') {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server listening to port 3000");
});
