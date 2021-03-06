quipsController = {};

quipsController.QUIPS_INCREMENT = 20;
quipsController.SHOW_MORE_ID = 'load-more';
quipsController.QUIPBOX_ID = 'quipbox';
quipsController.QUIPBOX_TEXT_ID = 'new-quip-text';
quipsController.AUTOSIZE_SELECTOR = 'textarea.autosize';

quipsController.initialize = function() {

  quipsController.resetUserSession();

  scrollList.initialize('#body-wrapper', 
    function(target){
      return !(
        $(target).attr('id') == 'update-quip-text' && quipsController.areEditing()
        );
    }
  );

  quipsController.initKeyhandler();

  $(quipsController.AUTOSIZE_SELECTOR).autosize();

  quipsController.initAutoRuns();   

  quipsController.initTextAreaPasteGuard();

  quipsController.focusQuipBox();
}

quipsController.initTextAreaPasteGuard = function() {
  $(quipsController.AUTOSIZE_SELECTOR).on('paste', function (e) {
    var element = $(this);
    var max = element.attr('maxlength');
    var text = e.originalEvent.clipboardData.getData('text/plain');
    if(text.length > max){
      element.val(text.slice(0, max));
      e.preventDefault();
      quipsController.textareaSizeUpdate();
    }
  });
}

quipsController.resetUserSession = function() {
  //console.info('resetting user session');
  Session.setDefault('quipsLimit', quipsController.QUIPS_INCREMENT);
  quipsController.quipsLimit(quipsController.QUIPS_INCREMENT)
  quipsController.areEditing(false);
  quipsController.searchPattern(null);
  quipsController.tagSearch(null);
  scrollList.activeElementId(quipsController.QUIPBOX_ID);
}

quipsController.quipsCount = function(limit) {
  if(limit == null){
    return Session.get('quipsCount');
  }
  Session.set('quipsCount', limit);
}

quipsController.quipsLimit = function(limit) {
  if(limit == null){
    return Session.get('quipsLimit');
  }
  Session.set('quipsLimit', limit);
}

quipsController.searchPattern = function(value) {
  if(value === undefined){
    return Session.get('searchPattern');
  }
  Session.set('searchPattern', value);
  if(value) {
    quipsController.parentId(null);
  }
}

quipsController.tagSearch = function(value) {
  if(value === undefined){
    return Session.get('tagSearch');
  }
  Session.set('tagSearch', value);
  if(value) {
    quipsController.parentId(null);
  }
}

quipsController.helpOverlay = function(value) {
  if(value === undefined){
    return Session.get('helpOverlay');
  }
  Session.set('helpOverlay', value);
}

quipsController.parentId = function(value) {
  if(value === undefined){
    return Session.get('parentId');
  }
  Session.set('parentId', value);
  if(value) {
    quipsController.searchPattern(null);
    quipsController.tagSearch(null);
  }
}

quipsController.parent = function() {
  var parentId = quipsController.parentId();
  return parentId ? Quips.findOne(parentId) : null;
}

quipsController.updateCount = function() {
  quipsController.quipsCount(Quips.find({}).count());
}

quipsController.areMoreQuips = function() {
  return quipsController.quipsCount() >= quipsController.quipsLimit();
}

quipsController.showMore = function() {
  quipsController.showingMore = true;
  scrollList.next();
  quipsController.quipsLimit(
    quipsController.quipsLimit() + quipsController.QUIPS_INCREMENT);
}

quipsController.areEditing = function(editing) {
  if (editing == null) {
    return Session.get('areEditing');
  }
  Session.set('areEditing', editing);
}

quipsController.addQuip = function(quip, asParent) {
  clientController.greetingMode(false);

  if(clientController.isGuest()){
    quip.guestQuip = true;
  }

  quip.parentId = quipsController.parentId();

  if(!asParent){
    asParent = quip.text[quip.text.length-1] == ':';
    if(asParent){
      quip.text = quip.text.slice(0,-1);
    }
  }

  Meteor.call("addQuip", quip, 
    function(err, data){
      if(asParent) {
        quipsController.parentId(data._id);
      }
    }
  );

  quipsController.areEditing(false);
  quipsController.searchPattern(null);
  quipsController.tagSearch(null);

  scrollList.scrollToId(quipsController.QUIPBOX_ID);
}

quipsController.updateQuip = function(id, text, tags) {
  //console.log('updateQuip', id, text, tags);
  Meteor.call("updateQuip", id, text, tags);
  quipsController.areEditing(false);
  return false;
}

quipsController.textareaSizeUpdate = function() {
  $(quipsController.AUTOSIZE_SELECTOR).trigger('autosize.resize');
}

quipsController.focusQuipBox = function() {
  var textarea = $('#' + quipsController.QUIPBOX_TEXT_ID);
  textarea.focus();
  textarea[0].setSelectionRange(0, 0);
}

quipsController.isQuip = function(itemId) {
  return itemId
    && itemId != quipsController.SHOW_MORE_ID
    && itemId != quipsController.QUIPBOX_ID;
}

quipsController.deleteQuip = function(id){
  if(confirm('Delete quip?')) {
    scrollList.prev();
    Meteor.call("deleteQuip", id);
  }
}

// Prevents flood of arrow keys when navigating list
// Returns true if current arrow key call should be accepted.
quipsController.acceptArrowKey = function() {
  if (quipsController.blockArrow) {
    return false;
  }
  quipsController.blockArrow = true;
  setTimeout(function() {
    quipsController.blockArrow = false;
  }, 50);
  return true;
}

var tagPattern = /\#[\w\d\-\_\.]{2,140}/
quipsController.wordIsTag = function(word){
  return tagPattern.test(word);
}

// todo: scan with regex
quipsController.parseLine = function(text){
  text = text.trim();
  var foundTag = false;
  var tags = [];

  // trailing tags
  do {
    var lastWord = Util.getLastWord(text);
    foundTag = false;
    if(
        quipsController.wordIsTag(lastWord)
        && lastWord.length < text.length 
      )
      {
        var tag = lastWord.slice(1);
        if(tag.length >= 2){
          tags.push(tag.trim().toLowerCase());
          text = text.slice(0, -lastWord.length).trim();
          foundTag = true;
        }
      }
  } while(foundTag)

  // leading tags
  do {
    var firstWord = Util.getFirstWord(text);
    foundTag = false;
    if(
        quipsController.wordIsTag(firstWord)
        && firstWord.length < text.length
      )
      {
        var tag = firstWord.slice(1);
        if(tag.length >= 2){
          tags.push(tag.trim().toLowerCase());
          text = text.slice(firstWord.length).trim();
          foundTag = true;
        }
      }
  } while(foundTag)

  text.split(' ').forEach(function(word){
    if(quipsController.wordIsTag(word))
    {
      var tag = word.slice(1);
      tags.push(tag.trim().toLowerCase());
    }
  }); 

  text = text.trim();
  if(!text.length){
    return null;
  }

  var quip = {
    text: text,
    tags: _.uniq(tags)
  };

  return quip;
}

// todo: scan with regex
quipsController.getTags = function(text){
  return _.chain(text.split(' '))
    .map(function(word) {
      return quipsController.wordIsTag(word)
        && word.slice(1).toLowerCase();
    })
    .compact()
    .uniq()
    .value();
}

quipsController.initAutoRuns = function() {

  Deps.autorun(function() {
    //console.log('quipsPub autorun');
    Meteor.user();  // force reload on user change??
    quipsController.quipsPubHandle = Meteor.subscribe('quipsPub',
      quipsController.quipsLimit(),
      quipsController.searchPattern(),
      quipsController.tagSearch(),
      function() {
        //console.log('quipsPub subscribe callback');
        scrollList.updateScroll();
      }
    );
  });

  Deps.autorun(function(){   
    quipsController.updateCount();
  });

  // When active element changes, set editing = false.
  Deps.autorun(function(){   
    var id = scrollList.activeElementId();
    //console.log('activeElementId: ' + id);
    quipsController.areEditing(false);
    if(id) {
      // blur quipbox when moving away
      if(id != quipsController.QUIPBOX_ID){
        $('#' + quipsController.QUIPBOX_TEXT_ID).blur();
      }
    }
  });

  // Deps.autorun(function(){   
  //   console.log('areEditing: ', quipsController.areEditing());
  // });

  // Deps.autorun(function(){   
  //   console.log('quipsCount: ', quipsController.quipsCount());
  // });

  // Deps.autorun(function(){   
  //   console.log('quipsLimit: ', quipsController.quipsLimit());
  // });

  Deps.autorun(function(){
    var searchPattern = quipsController.searchPattern();
    quipsController.quipsLimit(quipsController.QUIPS_INCREMENT);
  });

  Deps.autorun(function(){   
    var tagSearch = quipsController.tagSearch();
    quipsController.quipsLimit(quipsController.QUIPS_INCREMENT);
  });

  Deps.autorun(function(){
    var userId = Meteor.userId();
    if(userId && userId != clientController.priorUserId()){
      quipsController.resetUserSession();
    }
  });
  
}

quipsController.handleQuipboxKey = function(e) {
  var targetSelection = $(e.target);
  switch (e.which) {
    case 27: // esc
      quipsController.areEditing(false);
      targetSelection.val('');
      quipsController.textareaSizeUpdate();
      targetSelection.blur();
      quipsController.searchPattern (null);
      quipsController.tagSearch(null);
      e.preventDefault();
      return;
    case 13: // enter
      var text = targetSelection.val();

      if (text == null || !text.length) {
        e.preventDefault();
        return;
      }

      if(text.indexOf('?') == 0) {
        var pattern = text.slice(1);
        if(pattern.length < 2){
          e.preventDefault();
          return; 
        }

        // search
          
        if(pattern.indexOf('#') == 0){
          pattern = pattern.slice(1);
          quipsController.tagSearch(pattern);
          quipsController.searchPattern(null);
        }
        else {
          quipsController.searchPattern(pattern);
          quipsController.tagSearch(null);
        }
        $(e.target).val('');
        quipsController.textareaSizeUpdate();
      } 
      else {

        // add new
        
        var quip = quipsController.parseLine(text);
        if(quip){
          quipsController.addQuip(quip, e.ctrlKey);
          $(e.target).val('');
          quipsController.textareaSizeUpdate();          
        }
      }

      e.preventDefault();
    default:
      scrollList.activeElementId(quipsController.QUIPBOX_ID);
      // allow default
  }
}

quipsController.handleEnterKey = function(e) {
  var areEditing = quipsController.areEditing();
  var activeElementId = scrollList.activeElementId();

  // editing
  if (areEditing) {
    if(!activeElementId) {
      console.error('areEditing = true, but no active element');
      return;
    }
    var text = $(e.target).val();
    if (text != null && text.length) {
      if(e.ctrlKey){
        quipsController.parentId(activeElementId);
        return;
      }

      var parsed = quipsController.parseLine(text);
      if(parsed){
        quipsController.updateQuip(activeElementId, parsed.text, parsed.tags);
      }
    }
  } 

  // navigating
  else {
    if (activeElementId) {
      var activeElement = Quips.findOne(activeElementId);
      
      if(activeElement && activeElement.quipCount && activeElementId != quipsController.parentId()) {
        quipsController.parentId(activeElementId);
        return;
      }
      
      if(e.ctrlKey) {
        quipsController.parentId(activeElementId);
        return;
      }

      quipsController.areEditing(true);
      if (activeElementId == quipsController.QUIPBOX_ID) {
        quipsController.focusQuipBox();
      }
    }
  }

  e.preventDefault();
  return;
}

quipsController.initKeyhandler = function() {
  $(document).keydown(function(e) {

    var targetSelection = $(e.target);
    var targetId = targetSelection.attr('id');

    if(targetId == quipsController.QUIPBOX_ID
        || targetId == quipsController.QUIPBOX_TEXT_ID) {
      quipsController.handleQuipboxKey(e);
      return;
    }

    // Show more
    else if (targetId == quipsController.SHOW_MORE_ID){
        // todo: move this into handleEnterKey()
        if(e.which == 13){
          quipsController.showMore();
          e.preventDefault();
          return;
        }
    }

    // General key handler
    else {

      switch (e.which) {
        case 13: // enter
          quipsController.handleEnterKey(e);
          return;
        case 27: // esc
          if (quipsController.areEditing()) {
            quipsController.areEditing(false);
            e.preventDefault();
          }
          if(scrollList.activeElementId() == quipsController.QUIPBOX_ID){
            $('#' + quipsController.QUIPBOX_TEXT_ID)
              .val('')
              .blur();
            e.preventDefault();
          }
          return;
        case 35: // end
          if (!quipsController.areEditing()) {
            scrollList.last();
            e.preventDefault();
          }
          return;
        case 36: // home
          if (!quipsController.areEditing()) {
            scrollList.first();
            e.preventDefault();
          }
          return;
        case 37: // left
          var parent = quipsController.parent();
          if(parent) {
            if(parent.parentId){
              quipsController.parentId(parent.parentId);  
            } else {
              quipsController.parentId(null);  
            }
            scrollList.activeElementId(parent._id);
          }
          return;
        case 38: // up
          if (!quipsController.areEditing()) {
            if (quipsController.acceptArrowKey()) {
              scrollList.prev()
            }
            e.preventDefault();
          }
          return;
        case 39: // right
          quipsController.parentId(scrollList.activeElementId());
          return;
        case 40: // down
          if (!quipsController.areEditing()) {
            if (quipsController.acceptArrowKey()) {
              scrollList.next()
            }
            e.preventDefault();
          }
          return;
        case 46: // del
          if (!quipsController.areEditing()) {
            var activeId = scrollList.activeElementId();
            if(quipsController.isQuip(activeId)){
              quipsController.deleteQuip(activeId);
            }
          }
          return;
        default:
          return;
      }

    }

  });
}
