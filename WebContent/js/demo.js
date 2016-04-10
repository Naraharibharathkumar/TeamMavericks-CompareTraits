/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
$(document).ready(function() {
  var MIN_WORDS = 100;
  
  var widgetId1 = 'vizcontainer1', // Must match the ID in index.jade
  	widgetId2 = 'vizcontainer2',
    widgetWidth = 700, widgetHeight = 700, // Default width and height
    personImageUrl = 'images/app.png', // Can be blank
    language = 'en'; // language selection

  // Jquery variables
  var $content1 = $('#txt_Content1'),
      $content2 = $('#txt_Content2'),
    $loading   = $('.loading'),
    $error     = $('.error'),
    $errorMsg  = $('.errorMsg'),
    $traits    = $('.traits'),
    $traits1    = $('.traits1'),
    $results   = $('.results');

  /**
   * Clear the "textArea"
   */
  
  $('#btn_Clear1').click(function(){
      $('#btn_Clear1').blur();
      $content1.val('');
      updateWordsCountFor1();
    });
  
  $('#btn_Clear2').click(function(){
      $('#btn_Clear2').blur();
      $content2.val('');
      updateWordsCountFor2();
    });

  /**
   * Update words count on change
   */
  $content1.change(updateWordsCountFor1);
  $content2.change(updateWordsCountFor2);
  /**
   * Update words count on copy/past
   */
  $content1.bind('paste', function() {
    setTimeout(updateWordsCountFor1, 100);
  });

  $content2.bind('paste', function() {
    setTimeout(updateWordsCountFor2, 100);
  });
  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('.analysis-btn').click(function(){
    $('.analysis-btn').blur();
    $loading.show();
    $error.hide();
    $traits.hide();
    $results.hide();

    $.ajax({
      type: 'POST',
      data: {
        text: $content1.val(),
        language: language
      },
      url: 'demo',
      dataType: 'json',
      success: function(response) {
        $loading.hide();

        if (response.error) {
          showError(response.error);
        } else {
        	console.log(response);
          $results.show();
          showTraits(response);
          showTextSummary(response,1);
          showVizualization(response, widgetId1);
        }

      },
      error: function(xhr) {
        $loading.hide();

        var error;
        try {
          error = JSON.parse(xhr.responseText || {});
        } catch(e) {}
        showError(error.error || error);
      }
    });
    
    $.ajax({
        type: 'POST',
        data: {
          text: $content2.val(),
          language: language
        },
        url: 'demo',
        dataType: 'json',
        success: function(response) {
          $loading.hide();

          if (response.error) {
            showError(response.error);
          } else {
          	console.log(response);
            $results.show();
            showTraits1(response);
            showTextSummary(response,2);
            showVizualization(response, widgetId2);
          }

        },
        error: function(xhr) {
          $loading.hide();

          var error;
          try {
            error = JSON.parse(xhr.responseText || {});
          } catch(e) {}
          showError(error.error || error);
        }
      });
    
  });

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error || defaultErrorMsg);
  }

  /**
   * Displays the traits received from the
   * Personality Insights API in a table,
   * just trait names and values.
   */
  function showTraits(data) {
    console.log('showTraits()');
    $traits.show();

    var traitList = flatten(data.tree),
      table = $traits;

    table.empty();

    // Header
    $('#header-template').clone().appendTo(table);

    // For each trait
    for (var i = 0; i < traitList.length; i++) {
      var elem = traitList[i];

      var Klass = 'row';
      Klass += (elem.title) ? ' model_title' : ' model_trait';
      Klass += (elem.value === '') ? ' model_name' : '';

      if (elem.value !== '') { // Trait child name
        $('#trait-template').clone()
          .attr('class', Klass)
          .find('.tname')
          .find('span').html(elem.id).end()
          .end()
          .find('.tvalue')
            .find('span').html(elem.value === '' ?  '' : (elem.value + ' (± '+ elem.sampling_error+')'))
            .end()
          .end()
          .appendTo(table);
      } else {
        // Model name
        $('#model-template').clone()
          .attr('class', Klass)
          .find('.col-lg-12')
          .find('span').html(elem.id).end()
          .end()
          .appendTo(table);
      }
    }
  }
  
  function showTraits1(data) {
	    console.log('showTraits()');
	    $traits1.show();

	    var traitList = flatten(data.tree),
	      table = $traits1;

	    table.empty();

	    // Header
	    $('#header-template').clone().appendTo(table);

	    // For each trait
	    for (var i = 0; i < traitList.length; i++) {
	      var elem = traitList[i];

	      var Klass = 'row';
	      Klass += (elem.title) ? ' model_title' : ' model_trait';
	      Klass += (elem.value === '') ? ' model_name' : '';

	      if (elem.value !== '') { // Trait child name
	        $('#trait-template').clone()
	          .attr('class', Klass)
	          .find('.tname')
	          .find('span').html(elem.id).end()
	          .end()
	          .find('.tvalue')
	            .find('span').html(elem.value === '' ?  '' : (elem.value + ' (± '+ elem.sampling_error+')'))
	            .end()
	          .end()
	          .appendTo(table);
	      } else {
	        // Model name
	        $('#model-template').clone()
	          .attr('class', Klass)
	          .find('.col-lg-12')
	          .find('span').html(elem.id).end()
	          .end()
	          .appendTo(table);
	      }
	    }
	  }
  

  /**
   * Construct a text representation for big5 traits crossing, facets and
   * values.
   */
  function showTextSummary(data,order) {
	    console.log('showTextSummary()');
	    var paragraphs = textSummary.assemble(data.tree);
	    var div = $('#summary'+order);
	    $('#outputWordCountMessage'+order).text(data.word_count_message ? '**' + data.word_count_message + '.' : ''); 
	    div.empty();
	    paragraphs.forEach(function(sentences) {
	      $('<p></p>').text(sentences.join(' ')).appendTo(div);
	    });
	  }

/**
 * Renders the sunburst visualization. The parameter is the tree as returned
 * from the Personality Insights JSON API.
 * It uses the arguments widgetId, widgetWidth, widgetHeight and personImageUrl
 * declared on top of this script.
 */
function showVizualization(theProfile, widgetId) {
  console.log('showVizualization()');

  $('#' + widgetId).empty();
  var d3vis = d3.select('#' + widgetId).append('svg:svg');
  var widget = {
    d3vis: d3vis,
    data: theProfile,
    loadingDiv: 'dummy',
    switchState: function() {
      console.log('[switchState]');
    },
    _layout: function() {
      console.log('[_layout]');
    },
    showTooltip: function() {
      console.log('[showTooltip]');
    },
    id: 'SystemUWidget',
    COLOR_PALLETTE: ['#1b6ba2', '#488436', '#d52829', '#F53B0C', '#972a6b', '#8c564b', '#dddddd'],
    expandAll: function() {
      this.vis.selectAll('g').each(function() {
        var g = d3.select(this);
        if (g.datum().parent && // Isn't the root g object.
          g.datum().parent.parent && // Isn't the feature trait.
          g.datum().parent.parent.parent) { // Isn't the feature dominant trait.
          g.attr('visibility', 'visible');
        }
      });
    },
    collapseAll: function() {
      this.vis.selectAll('g').each(function() {
        var g = d3.select(this);
        if (g.datum().parent !== null && // Isn't the root g object.
          g.datum().parent.parent !== null && // Isn't the feature trait.
          g.datum().parent.parent.parent !== null) { // Isn't the feature dominant trait.
          g.attr('visibility', 'hidden');
        }
      });
    },
    addPersonImage: function(url) {
      if (!this.vis || !url) {
        return;
      }
      var icon_defs = this.vis.append('defs');
      var width = this.dimW,
        height = this.dimH;

      // The flower had a radius of 640 / 1.9 = 336.84 in the original, now is 3.2.
      var radius = Math.min(width, height) / 16.58; // For 640 / 1.9 -> r = 65
      var scaled_w = radius * 2.46; // r = 65 -> w = 160

      var id = 'user_icon_' + this.id;
      icon_defs.append('pattern')
        .attr('id', id)
        .attr('height', 1)
        .attr('width', 1)
        .attr('patternUnits', 'objectBoundingBox')
        .append('image')
        .attr('width', scaled_w)
        .attr('height', scaled_w)
        .attr('x', radius - scaled_w / 2) // r = 65 -> x = -25
        .attr('y', radius - scaled_w / 2)
        .attr('xlink:href', url)
        .attr('opacity', 1.0)
        .on('dblclick.zoom', null);
      this.vis.append('circle')
        .attr('r', radius)
        .attr('stroke-width', 0)
        .attr('fill', 'url(#' + id + ')');
    }
  };

  widget.dimH = widgetHeight;
  widget.dimW = widgetWidth;
  widget.d3vis.attr('width', widget.dimW).attr('height', widget.dimH);
  widget.d3vis.attr('viewBox', '0 0 ' + widget.dimW + ', ' + widget.dimH);
  renderChart.call(widget);
  widget.expandAll.call(widget);
  if (personImageUrl)
    widget.addPersonImage.call(widget, personImageUrl);
}

  /**
   * Returns a 'flattened' version of the traits tree, to display it as a list
   * @return array of {id:string, title:boolean, value:string} objects
   */
  function flatten( /*object*/ tree) {
    var arr = [],
      f = function(t, level) {
        if (!t) return;
        if (level > 0 && (!t.children || level !== 2)) {
          arr.push({
            'id': t.name,
            'title': t.children ? true : false,
            'value': (typeof (t.percentage) !== 'undefined') ? Math.floor(t.percentage * 100) + '%' : '',
            'sampling_error': (typeof (t.sampling_error) !== 'undefined') ? Math.floor(t.sampling_error * 100) + '%' : ''
          });
        }
        if (t.children && t.id !== 'sbh') {
          for (var i = 0; i < t.children.length; i++) {
            f(t.children[i], level + 1);
          }
        }
      };
    f(tree, 0);
    return arr;
  }
  
  function updateWordsCountFor1() {
      var text = $content1.val();
      var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
      $('#wordCount1').css('color',wordsCount < MIN_WORDS ? 'red' : 'gray');
      $('#wordCountTxt1').text(wordsCount);
    }
  
  function updateWordsCountFor2() {
      var text = $content2.val();
      var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
      $('#wordCount2').css('color',wordsCount < MIN_WORDS ? 'red' : 'gray');
      $('#wordCountTxt2').text(wordsCount);
    }

  function onSampleTextChange() {
    var isEnglish = $('#english_radio').is(':checked');
    language = isEnglish ? 'en' : 'es';

    $.get('text/' + language + '.txt').done(function(text) {
      $content1.val(text);
      $content2.val(text);
      updateWordsCountFor1();
      updateWordsCountFor2();
    });
  }
  onSampleTextChange();
  $content1.keyup(updateWordsCountFor1);
  $content2.keyup(updateWordsCountFor2);
  $('.sample-radio').change(onSampleTextChange);
});
