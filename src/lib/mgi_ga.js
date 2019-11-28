/* Name: mgi_ga.js
 *
 * Adapted from MGI modele of the same name. 
 * Exports a function ga_logEvent which logs an event at Google Analytics
 * under the MGI account. The function takes these arguments:
 *      category     required string; names the object that was interacted with
 *      action       required string; what type of interaction?
 *      label        optional string; subcategory or other label for the event
 *      value        optional integer; numeric value associated with the event
 */


/* This is the standard "Javascript tracking snippet" from Google.  See:
 *              https://developers.google.com/analytics/devguides/collection/analyticsjs/
 */

// This asynchronously loads the analytics.js library from Google.
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

// These are queued until the analytics library loads, at which point they execute.
ga('create', 'UA-11017903-1', 'auto');
ga('send', 'pageview');

// helper function
function ga_logEvent(
        category,       // required string; names the object that was interacted with
        action,         // required string; what type of interaction?
        label,          // optional string; subcategory or other label for the event
        value           // optional integer; numeric value associated with the event
        ) {
        
        ga('send', 'event', category, action, label, value);
}

//
export default {
  ga_logEvent
}

