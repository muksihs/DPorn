let allUsers = []
let allContent = []
let converter = new showdown.Converter({ tables: true })
let totalVestingShares, totalVestingFundSteem;

/**
 * gets totalVestingShares and totalVestingFundSteem from STEEM API to use later
 */
steem.api.getDynamicGlobalProperties((err, result) => {
  totalVestingShares = result.total_vesting_shares;
  totalVestingFundSteem = result.total_vesting_fund_steem;
})

/**
 * Calls steem api for current top 20 trending tags
 * @function
 */
function getTrendingTags(){
  steem.api.getTrendingTags('', 20, (err, result) => {
    if (err) return console.log(err);
    displayTrendingTags(result)
  });
}

/**
 * Gets a set of posts trending from the the steem api
 * @function
 * @param {Object} query - a steem feed query object - {tag: 'photography', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
// function getTrending(query, initial){
//   steem.api.getDiscussionsByTrending(query, (err, result) => {
//     if (err === null) {
//       displayContent(result,initial)
//       getaccounts(result.map(post => post.author))
//     } else {
//       console.log(err);
//     }
//   });
// }

/**
 * Gets a set of latest posts from the the steem api
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'photography', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getLatest(query, initial){
  //console.log(query)
  steem.api.getDiscussionsByCreated(query, (err, result) => {
    if (err === null) {
      displayContent(result, initial)
      getaccounts(result.map(post => post.author))
    } else {
      console.log(err);
    }
  });
}

/**
 * Gets a set of latest posts from specific author
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'ausername', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getBlog(query, initial){
  steem.api.getDiscussionsByBlog(query, (err, result) => {
      displayContent(result, initial)
  })
}

/**
 * Gets a set of latest posts from specific authors feed (who they follow)
 * @function
 * @param {Object} query - a steem feed query object - e.g {tag: 'username', 'limit': 20 }
 * @param {Boolean} initial - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */
function getUserFeed(query, initial){
  steem.api.getDiscussionsByFeed(query, (err, result) => {
    console.log(result)
    console.log(query)
    displayContent(result,initial)
  });
}

/**
 * Adds more posts to the current feed view
 * @function
 * @param {String} filter - 'latest', 'trending', 'user-feed'
 * @param {boolean} tag - a tag used on posts
 */
function getMoreContent(filter, tag){
  console.log(filter),console.log(tag)
  let lastItem = allContent[allContent.length - 1]
  let username = $('main').data('username')
  let query = {
      tag: tag,
      limit: 24,
      start_author: lastItem.author,
      start_permlink: lastItem.permlink }

      if(filter === 'trending'){
        getTrending(query, false)
      } else if(filter === 'created'){
        console.log(query)
        getLatest(query, false)
      } else if(filter === 'user-feed'){
        query.tag = username
        console.log(query), console.log("query.tag")
        getUserFeed(query, false)
      } else {
        console.log(query),
        query.tag = username
        getBlog(query, false)
      }
}
/**
 * @function
 * @param {array} result - An array with tags and counts
 */
function displayTagPage(result){
  //console.log(result)
  result.sort(function(a,b) {
    if (a._id.tags < b._id.tags)
      return -1;
    if (a._id.tags > b._id.tags)
      return 1;
    return 0;
  })
  for (let i = 0; i < result.length; i++) {
    let tag = result[i]._id.tags
    let count = result[i].count
    let tagTemplate = `
    <div class="aTag col-4"><a href="/feed/created/${tag}"><span>${tag} (${count})</span></a></div>
    `
    $('.taglist').append(tagTemplate)
  }
}

/**
 * Adds more posts to the current feed view
 * @function
 * @param {Array} result - An Array of Steem posts from the STEEM API
 * @param {Int} page - If this is an initial call or a call from 'get-more-posts' to add aditional posts to feed
 */

function displayContent(result, page){
  //console.log(result)
  //if (!initial) result.shift()
  //console.log(result)
    if (page > 0) result = result.slice(page*30,result.length)
  //for (let i = 0; i < result.length ; i++) {
    for (let i = 0; i < 30 && i < result.length ; i++) {
      let post = result[i];
      allContent.push(post)

      // var urlRegex = /(https?:\/\/[^\s]+)/g;
      // post.body = post.body.replace(urlRegex, (url) => {
      //   let last = url.slice(-3)
      //   if ( last === 'jpg' || last === 'png' || last === 'jpe' || last === 'gif' )  {
      //     return '<img src="' + url + '">';
      //   } else { return url }
      // })

      // if( typeof JSON.parse(post.json_metadata).image === 'undefined' ){
      //   image = genImageInHTML(post.body)
      // } else {
      //   image = JSON.parse(post.json_metadata).image[0]
      // }
      let image = `https://gateway.ipfs.io/ipfs/` + post.posterHash
      //let image = `https://dporn.co/vidcache/` + post.posterHash
      let url = '/watch/@' + post.username + '/' + post.permlink
      let id = ''
      //console.log(url)
      let itemTemplate = `
      <div class="item d-flex flex-wrap p-0" data-post-id="${id}" data-url="${url}" data-permlink="${post.permlink}">
      <div class="item__image__wrapper">
      <a href="${url}"><img class="item__image" src="${image}" onerror=""></a>
	        </div>
          <div class="item__meta">
	        <div class = "item__title">
                  <a href="${url}"><h3>${post.title}</h3></a>
          </div>
          <div class = "item__details">
	          <div class = "item__author float-left">
                    <span><a href=/@${post.username}>@${post.username}</a></span>
            </div>
            <div class = "item__value float-right">
              <span>$${post.value} SBD</span>
            </div>
          </div>
              <form method="post" class="item__upvote">
                <input type="hidden" name="postId" value="${post.id}">
                <input type="hidden" name="author" value="${post.username}">
                <input type="hidden" name="permlink" value="${post.permlink}">
                <input type="submit" class="vote" value="Vote">
              </form>
         </div>
	     </div>
        `
        $('.feed-insert').append(itemTemplate)
  }
}

/**
 * Adds an array of tags to the page
 * @function
 * @param {Array} tags - An Array of Steem tags from the STEEM API
 */
function displayTrendingTags(tags){
  let feedType = $('main.feed').data('feed-type')

  for (var i = 1; i < tags.length; i++) {
    let tag = tags[i]
    let template = `<a class="btn btn-outline-dark" href="/feed/${feedType}/${tag.name}">${tag.name}</a>`

    $('.trending__tags').append(template)
  }
}

/**
 * calls the steem api for a list of accounts - adds them to allUsers global var
 * @function
 * @param {Array} username - an array of steem usernames e.g ['fred', 'bob', 'ned']
 */
function getaccounts(usernames){
  steem.api.getAccounts(usernames, (err, result) => {
    allUsers = allUsers.concat(result)
  })
}

/**
 * Gets the first image from a set of markdown where possible
 * @function
 * @param {String} markdown - A String containing markdown formatted text
 */
function genImageInHTML(markdown){
    let placeholder = document.createElement('div');
    placeholder.innerHTML = converter.makeHtml(markdown)
    let image = placeholder.querySelector('img') ;
    if (image) {
      return image.src
    } else {
      return false
    }
}

/**
 * Gets post and comment data for a url slug
 * @function
 * @param {String} url - '/category}/username/permlink'
 */
function getPostAndComments(url) {
  steem.api.getState(url, (err, result) => {
    let users = result.accounts;
    let resultsArray = [];
    for ( post in result.content ){

      var html = result.content[post].body

      resultsArray.push({
        id: result.content[post].id,
        title: result.content[post].root_title,
        author: result.content[post].author,
        body: html,
        json: result.content[post].json_metadata,
        permlink: result.content[post].permlink,
        depth: result.content[post].depth,
        root_comment: result.content[post].root_comment,
        parent_permlink: result.content[post].parent_permlink,
        created: result.content[post].created,
        votes: result.content[post].net_votes,
        voters: result.content[post].active_votes.map(vote => vote.voter),
        value: parseFloat(result.content[post].pending_payout_value.slice(0, -4)) + parseFloat(result.content[post].total_payout_value.slice(0, -4))
      })
    }

    // Sort By Date/ID
    resultsArray = resultsArray.sort((a,b) => {
      return b.id - a.id
    });

    // Find Deepest Comment
    let maxDepthComment = resultsArray.reduce((prev, current) => {
      return (prev.depth > current.depth) ? prev : current
    })

    // Multi demention array by
    let resultsByDepth = [];
    for (var i = 0; i < maxDepthComment.depth + 1; i++) {
      resultsByDepth.push(resultsArray.filter(elem => {
        return elem.depth === i
      }))
    }
    appendSinglePost(resultsByDepth[0][0], users)
    appendComments(resultsByDepth)

  })
}

/**
 * gets a profile image from a steem users data where possible
 * @function
 * @param {Object} author - an author object from a steem api request
 */
function generateProfileImage(author){
  let profileImage = 'img/default-user.jpg';

  try {
    if (author.json_metadata === '' || typeof author.json_metadata === 'undefined' ) {
      author.json_metadata = { profile_image : false }
    } else {
      author.json_metadata = JSON.parse(author.json_metadata).profile
    }

    profileImage = author.json_metadata.profile_image ? 'https://steemitimages.com/128x128/' + author.json_metadata.profile_image : '';

  } catch(err){
    console.log(err)
  }
  return profileImage
}

 /**
    * Donation function. Called when you want user to donate to creators. Returns a Steemconnect URL in wich user can press active key to send donation. * @function
 * @param {String} donateCoin - Coin users want to donate, can be SBD or STEEM.
 * @param {String} donateAmount - How much user wants to donate as a stirng.
 * @param {String} donateMemo - What the memo user want to send with the donation.
 * @param {String} donateFrom - User who donatation comes from. Can be an empty string if user isn't logged in.
 */

    function donate(donateCoin, donateAmount, donateMemo, donateFrom){
      var coin = donateCoin
      var to = author.name
      var amount = donateAmount
      var memo = donateMemo.replace(/\s+/g,'%20')
      var from = ""
      //todo: IF user is autheticated {
      //from = user.name
      //}
      let site = "https://steemconnect.com/sign/transfer?to=" + to + "&from=" + from + "&memo=" + memo + "&amount=" + amount + "%20" + coin
      return site
    }



/**
 * appends the main part of a post to the page
 * @function
 * @param {Object} post - steem post object from getPostAndComments()
 * @param {Array} users - an Array of steem user accounts from steem api
 */
function appendSinglePost(post, users){
  let author = users[post.author]
  let netVoteCount = post.votes
  let html = `<div class="steemPostBody">` + converter.makeHtml(post.body) + `</div>`
  let profileImage = generateProfileImage(author)
  let voteWeight = 100
  let info = $('main').data()
  let activeUser = info.activeuser
  //console.log(info)
  let voted = false
  let tags = JSON.parse(post.json).tags.reduce( (all,tag) => all + `<a href="/feed/created/${tag}"><span>${tag}</span></a>`, '')

  let header = `
    <div class = "videowrapper">
      <div class="tags">${tags}</div> 
      <video controls preload="auto"> 
        <source = src="/vidcache/${info.videohashstr}"></source>
        <source = src="https://gateway.ipfs.io/ipfs/${info.videohashstr}"></source>
      </video>

      <div class = "videoFooter d-flex justify-content-between">
        <div class = "authorInfo">
          <img src="${profileImage}" class="author-img" width="35" height="35" src="">   
          <a href="/@${post.author}">@${post.author}</a>
        </div>       
        <div class="videotitle"><h2 class="title">${post.title}</h2></div>
      </div>


    </div>` 

 let voteButton = `<div class=videoVoteWrapper d-flex justify-content-center>
            <div id=voteRangeWrapper class="voteRangeWrapper p4"><input id="voteRangeSlider" type="range" min="1" max="100" value="100" class="voteSlider"></div>
            <div class="voteFormWrapper p4"><form method="post">
              <input type="hidden" name="postId" value="${post.id}">
              <input type="hidden" name="author" value="${post.author}">
              <input type="hidden" name="permlink" value="${post.permlink}">
              <input type="hidden" id="videoVoteWeight" name="weight" value="${voteWeight}">
              <input class="vote btn btn-primary" type="submit" id="videoVoteButton" value="Upvote ${voteWeight}%">
            </form></div>
            <div class="postValue">This video has earned $${post.value} SBD from upvotes</div></div>`;

 let commentBox = `
  <div>
    <textarea class="comment-message" rows="5"></textarea>
    <span class="send-comment btn btn-primary" data-parent="${post.author}" data-parent-permlink="${post.permlink}" data-parent-title="${post.title}">Post Comment</span>
  </div>
  `
  $('main').append(header + html + voteButton + commentBox)


 let slider = document.getElementById("voteRangeSlider");
 slider.oninput = function() {
   voteWeight = this.value
   ,document.getElementById("videoVoteButton").value="Upvote "+voteWeight+"%"
   ,document.getElementById("videoVoteWeight").value=voteWeight;
 }

steem.api.getActiveVotes(post.author, post.permlink, function(err, result) {
        let voted = false
        // console.log(activeUser)
	for (var i = 0; i < result.length; i++) {
          if (result[i].voter === activeUser) {
             if (result[i].percent > 0) {
               setVotedStatus(true)
             };
          } else {
              continue;
          }
        }
    return result});

  function setVotedStatus(voted){
        if (voted === true) {
          voteWeight = 0,
          document.getElementById("videoVoteWeight").value=voteWeight,
          document.getElementById("videoVoteButton").value="Remove Vote",
          document.getElementById("voteRangeWrapper").classList.add('hidden')
        } else {
          document.getElementById("videoVoteWeight").value=voteWeight,
          document.getElementById("videoVoteButton").value="Vote "+`${voteWeight}`+"%",
          document.getElementById("voteRangeWrapper").classList.remove('hidden'),
          console.log(document.getElementById("voteRangeWrapper").classList)
        }
  }

}


/**
     * Donation function. Called when you want user to donate to creators. Returns a Steemconnect URL in wich user can press active key to send donation.
 * @function
 * @param {String} donateCoin - Coin users want to donate, can be SBD or STEEM.
 * @param {String} donateAmount - How much user wants to donate as a stirng.
 * @param {String} donateMemo - What the memo user want to send with the donation.
 * @param {String} donateFrom - User who donatation comes from. Can be an empty string if user isn't logged in.
 */

     function donate(donateCoin, donateAmount, donateMemo, donateFrom){
       var coin = donateCoin
       var to = author.name
       var amount = donateAmount
       var memo = donateMemo.replace(/\s+/g,'%20')
       var from = ""
       //todo: IF user is autheticated {
       //from = user.name
       //}
       let site = "https://steemconnect.com/sign/transfer?to=" + to + "&from=" + from + "&memo=" + memo + "&amount=" + amount + "%20" + coin
       return site
 
     }


/**
 * appends comments to single page after main content
 * @function
 * @param {Array} comments - an Array of comments to a steem post
 */
function appendComments(comments){
  $('main').append('<div class="comments"></div>')

    comments.forEach( (postsAtDepth, i, arr) => {
      postsAtDepth.forEach( (comment, i, arr) => {
        let template = createCommentTemplate(comment)
        if ( comment.depth === 1 ) {
          $('.comments').prepend( template)
        } else if ( comment.depth  > 1) {
          var permlink = comment.parent_permlink
          $('.' + permlink ).append( template)
        }
      })
    })
}

/**
 * creates the HTML for a comment from a comment object
 * @function
 * @param {Object} post - a comment object from STEEM  getState API
 */
createCommentTemplate = (post) => {
      var permlink = post.parent_permlink
      var html = converter.makeHtml(post.body)
      var voteMessage = (post.votes > 1 || post.votes == 0 )? 'votes' : 'vote'
      var voteValue = (post.value > 0) ? '</span> <span>|</span> <span>$' + post.value  + '</span><span>': ''
      var template = `
      <div data-post-id="${post.id}"
      data-permlink="${post.permlink}"
      data-author="${post.author}"
      data-title="${post.title}"
      data-post-depth="${post.depth}"
      class="comment comment-level-${post.depth} ${post.permlink}">
        <h4>`+
          //<a href="/@${post.author}" target="_blank">@${post.author}</a>
          `@${post.author}
          <span> &middot; </span> <span> ${ moment.utc(post.created).fromNow() } </span>
        </h4>
        <p>${ html }</p>
        <div class="meta">`+
          /*<form method="post">
            <input type="hidden" name="postId" value="${post.id}">
            <input type="hidden" name="author" value="${post.author}">
            <input type="hidden" name="permlink" value="${post.permlink}">
            <input type="submit" class="vote" value="Vote">
          </form>*/
          `<span class="sc-item__divider">__</span>`+
          //<span class="sc-item__votecount">${post.votes} ${voteMessage} </span>
        `</div>
      </div>`
      return template;
    }

/**
 * format raw user account data from Steem api
 * @function
 * @param {String} username - a single steem username
 */
function getAccountInfo(username) {
    let userInfo;

    return new Promise((resolve, reject) => {

      steem.api.getAccounts([username], (err, result) => {

        let user = result[0]

        let jsonData;

        try {jsonData = JSON.parse(user.json_metadata).profile} catch(err) { console.log(err)}
        console.log(jsonData)
        // steem power calc
        let vestingShares = user.vesting_shares;
        let delegatedVestingShares = user.delegated_vesting_shares;
        let receivedVestingShares = user.received_vesting_shares;
        let steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
        let delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
        let outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

        // vote power calc
        let lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
        let votePower = user.voting_power += (10000 * lastVoteTime / 432000);
        votePower = Math.min(votePower / 100, 100).toFixed(2);

        let data = {
          name: user.name,
          image: jsonData.profile_image ? 'https://steemitimages.com/512x512/' + jsonData.profile_image : '',
          cover: jsonData.cover_image,
          rep: steem.formatter.reputation(user.reputation),
          effectiveSp: parseInt(steemPower  + delegatedSteemPower - -outgoingSteemPower),
          sp: parseInt(steemPower).toLocaleString(),
          delegatedSpIn: parseInt(delegatedSteemPower).toLocaleString(),
          delegatedSpOut: parseInt(-outgoingSteemPower).toLocaleString(),
          vp: votePower,
          steem: user.balance.substring(0, user.balance.length - 5),
          sbd: user.sbd_balance.substring(0, user.sbd_balance.length - 3),
          numOfPosts: user.post_count,
          followerCount: '',
          followingCount: '',
          usdValue: '',
          createdDate: new Date (user.created)
        }
        steem.api.getFollowCount(user.name, function(err, result){
          data.followerCount = result.follower_count
          data.followingCount = result.following_count
          resolve(data)
        })
        data.usdValue = steem.formatter.estimateAccountValue(user)
      })
    });
}

/**
 * adds account transactions to user transfers page
 * @function
 * @param {String} username - a single steem username
 */
function getAccountTransactions(username) {
  steem.api.getAccountHistory(username, -1, 10000, function(err, result){
    if (err) throw err

    result.forEach((tx, i) => {
      let txTime = new Date(tx[1].timestamp).valueOf()
      if(tx[1].op[0] === 'transfer') {
        let row = `<tr>
          <td>${moment.utc(txTime).fromNow()}</td>
          <td>Transfer: ${tx[1].op[1].amount} from: ${tx[1].op[1].from} To: ${tx[1].op[1].to}
          <td class="table-cell-break">${tx[1].op[1].memo}</td>
        </tr>`
        $('.account-history tbody').append(row)
      }
      if(tx[1].op[0] == 'claim_reward_balance'){
        let row = `<tr>
        <td>${moment.utc(txTime).fromNow()}</td>
        <td>Claim Reward ${tx[1].op[1].reward_sbd} ${tx[1].op[1].reward_steem} ${vestsToSteem(parseFloat(tx[1].op[1].reward_vests)).toFixed(3)}SP</td>
        <td></td>
        </tr>`
        $('.account-history tbody').append(row)
      }
    })
  })
}

/**
 * helper to format vests to readable Steem power number
 * @function
 * @param {String} username - a single steem username
 */
function vestsToSteem(vests){
  return steem.formatter.vestToSteem(vests, totalVestingShares, totalVestingFundSteem);
}

// On Page Load

if ($('main').hasClass('feed') ) {
    let feedType = $('main.feed').data('feed-type')
    //let tag = $('main.feed').data('tag') || ''
    let posts = $('main.feed').data('posts')
    //console.log($('main.feed').data('posts'))
    let tag = "dporncovideo" || ''
    if(feedType === 'trending'){
      //getTrendingTags()
      displayContent(posts,0)
      //getTrending({tag, 'limit': 30 }, true)
    } else if (feedType === 'user-feed'){
      //let username = $('main').data('username')
      //getUserFeed({ tag: username, limit: 20 }, true)
      displayContent(posts,0)
      console.log(posts)
    } else {
      // getTrendingTags()
      displayContent(posts,0)
    }
}

if ($('main').hasClass('single')) {
  let data = $('main').data()
  getPostAndComments(`/${data.category}/@${data.username}/${data.permlink}`,`${data.videohashstr}`)
}

if ($('main').hasClass('tagspage')) {
  displayTagPage($('main').data('tags'))
}

if ($('main').hasClass('dashboard')) {
  let username = $('main').data('username')
  getUserFeed(username)
}

if ($('main').hasClass('transfers')){
  let username = $('main').data('username')
  getAccountTransactions(username)
  getAccountInfo(username).then(data => {
    console.log(data)
    let template =`
      <div class="balances">
        <h5>STEEM: ${data.steem} </h5>
        <h5>STEEM Power: ${data.sp}</h5>
        <h5>SBD: ${data.sbd} </h5>
      </div>
    `
    $('.wallet').append(template)
  })
}

if ($('main').hasClass('profile') ) {
  let username = $('.profile').data('username')
  getAccountInfo(username).then(data => {
    data.cover = data.cover || 'http://placehold.it/1200x300?text=-'
    let template =
    `<header class="profile__header" style="background-image: url(${data.cover})">
      <h2>${data.name} [${data.rep}]</h2>
      <img src="${data.image}" width="100px">
      <h5>Followers: ${data.followerCount} - Following: ${data.followingCount}</h5>
      </header>
    `
    $('main').prepend(template)
  })
  let query = { tag: username, limit: 10 }
  getBlog(query, true)
}

// UI Actions

$('main').on('click', '.vote',(e) => {
  let $voteButton = $(e.currentTarget)
  $(e.currentTarget).prop('disabled', true);
  e.preventDefault()
  //console.log(e.currentTarget.parent)
  $.post({
    url: '/post/vote',
    dataType: 'json',
    data:  $(e.currentTarget).parent().serialize()
  }, (response) => {
    if (response.error) {
      $(`<span>${response.error.error_description}</span>`).insertAfter($voteButton)
      $(e.currentTarget).prop('disabled', false);
    } else {
      $('<span>Voted!</span>').insertAfter($voteButton);
      $(e.currentTarget).prop('disabled', false);
        if (document.getElementById("videoVoteWeight").value > 0) {
          document.getElementById("videoVoteWeight").value=0,
          document.getElementById("videoVoteButton").value="Remove Vote",
          document.getElementById("voteRangeWrapper").classList.add('hidden')
        } else {
          document.getElementById("videoVoteWeight").value=100,
          document.getElementById("videoVoteButton").value="Vote 100%",
          document.getElementById("voteRangeWrapper").classList.remove('hidden');
        }
      }
  })
})

$('main').on('click', '.send-comment', (e) => {
  let $comment = $(e.currentTarget)

  $.post({
        url: `/post/comment`,
        dataType: 'json',
        data: {
          parentAuthor: $comment.data('parent'),
          parentPermlink: $comment.data('parent-permlink'),
          message: $('.comment-message').val(),
          parentTitle: $comment.data('parent-title')
        }
      }, (response) => {
          console.log(response)
          if (response.error) {
            $(`<span>${response.error.error_description}</span>`).insertAfter($comment)
          } else {
            $(`<p>${response.msg}</p>`).insertAfter($comment)
          }
      })
})

$('.load-more-posts').on('click', (e) => {
  //let filter = $('main').data('feed-type')
  //let tag = $('main').data('tag') || ''
  //let tag = "dporncovideo"
  //getMoreContent(filter, tag)
  let posts = $('main.feed').data('posts')
  //document.getElementById("morevotesbutton").value - get the last 2 char, trim it, throw it in a variable, and use that in the next line
  displayContent(posts, 2)
  
})
