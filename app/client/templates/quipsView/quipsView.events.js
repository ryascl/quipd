
var events = {
    'click #load-more': function() {
      quipsController.showMore();
    },
    'click #resetQuips': function() {
      Meteor.call('resetQuips');
    },
    'click #seedQuips': function() {
      Meteor.call('seedQuips');
    },
    'click .quip-del': function() {
      quipsController.deleteQuip(this._id);
      return false;
    },
    'click .tag': function() {
      quipsController.tagSearch(this.valueOf());
      quipsController.searchPattern(null);
      return false;
    },
    'click #search-quit': function() {
      quipsController.tagSearch(null);
      quipsController.searchPattern(null);
      return false;
    },
    'click #quipbox, click #new-quip-text': function() {
      scrollList.activeElementId(quipsController.QUIPBOX_ID);
      return false;
    },
    'click .help-overlay .remove': function() {
      quipsController.helpOverlay(false);
      return false;
    },
    'click .help-overlay': function() {
      // ignore
      return false;
    }
  };

events['click ' + scrollList.SCROLL_ITEM_SELECTOR] = function(event) {
      //console.log('click ' + scrollList.SCROLL_ITEM_SELECTOR);

      var target = $(event.currentTarget);
      var id = target && target.attr('id');
      if(!id) return;

      if(id == quipsController.SHOW_MORE_ID 
        || id == quipsController.QUIPBOX_ID){
        return;
        scrollList.activeElementId(id);
      }

      var activeId = scrollList.activeElementId();
      if(activeId == id){
        quipsController.areEditing(true);
      }
      else{
        quipsController.areEditing(false)
        scrollList.activeElementId(id);
      }
    }

Template.quipsView.events(events);