/**
 * Stores the list of all Peers information.
 * @attribute _peerInformations
 * @param {JSON} (#peerId) The Peer ID associated with the information.
 * @param {String|JSON} (#peerId).userData The custom user data
 *   information set by developer. This custom user data can also
 *   be set in <a href="#method_setUserData">setUserData()</a>.
 * @param {JSON} (#peerId).settings The Peer Stream
 *   streaming settings information. If both audio and video
 *   option is <code>false</code>, there should be no
 *   receiving remote Stream object from this associated Peer.
 * @param {Boolean|JSON} [(#peerId).settings.audio=false] The
 *   Peer Stream streaming audio settings. If
 *   <code>false</code>, it means that audio streaming is disabled in
 *   the remote Stream of the Peer.
 * @param {Boolean} [(#peerId).settings.audio.stereo] The flag that indicates if
 *   stereo should be enabled in the Peer connection Stream
 *    audio streaming.
 * @param {Boolean|JSON} [(#peerId).settings.video=false] The Peer
 *   Stream streaming video settings. If <code>false</code>, it means that
 *   video streaming is disabled in the remote Stream of the Peer.
 * @param {JSON} [(#peerId).settings.video.resolution] The Peer
 *   Stream streaming video resolution settings. Setting the resolution may
 *   not force set the resolution provided as it depends on the how the
 *   browser handles the resolution. [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number} [(#peerId).settings.video.resolution.width] The Peer
 *   Stream streaming video resolution width.
 * @param {Number} [(#peerId).settings.video.resolution.height] The Peer
 *   Stream streaming video resolution height.
 * @param {Number} [(#peerId).settings.video.frameRate] The Peer
 *   Stream streaming video maximum frameRate.
 * @param {Boolean} [(#peerId).settings.video.screenshare=false] The flag
 *   that indicates if the Peer connection Stream object sent
 *   is a screensharing stream or not.
 * @param {String} [(#peerId).settings.bandwidth] The Peer configuration for
 *   the maximum sending bandwidth. The flags set may or may not work depending
 *   on the browser implementations and how it handles it.
 * @param {String} [(#peerId).settings.bandwidth.audio] The maximum
 *   sending audio bandwidth bitrate in <var>kb/s</var>. If this is not provided,
 *   it will leave the audio bitrate to the browser defaults.
 * @param {String} [(#peerId).settings.bandwidth.video] The maximum
 *   sending video bandwidth bitrate in <var>kb/s</var>. If this is not provided,
 *   it will leave the video bitrate to the browser defaults.
 * @param {String} [(#peerId).settings.bandwidth.data] The maximum
 *   sending data bandwidth bitrate in <var>kb/s</var>. If this is not provided,
 *   it will leave the data bitrate to the browser defaults.
 * @param {JSON} (#peerId).mediaStatus The Peer Stream mute
 *   settings for both audio and video streamings.
 * @param {Boolean} [(#peerId).mediaStatus.audioMuted=true] The flag that
 *   indicates if the remote Stream object audio streaming is muted. If
 *   there is no audio streaming enabled for the Peer, by default,
 *   it is set to <code>true</code>.
 * @param {Boolean} [(#peerId).mediaStatus.videoMuted=true] The flag that
 *   indicates if the remote Stream object video streaming is muted. If
 *   there is no video streaming enabled for the Peer, by default,
 *   it is set to <code>true</code>.
 * @param {JSON} (#peerId).agent The Peer platform agent information.
 * @param {String} (#peerId).agent.name The Peer platform browser or agent name.
 * @param {Number} (#peerId).agent.version The Peer platform browser or agent version.
 * @param {Number} (#peerId).agent.os The Peer platform name.
 * @type JSON
 * @private
 * @required
 * @component Peer
 * @for Skylink
 * @since 0.3.0
 */
Skylink.prototype._peerInformations = {};

/**
 * Stores the self credentials that is required to connect to
 *   Skylink platform signalling and identification in the
 *   signalling socket connection.
 * @attribute _user
 * @type JSON
 * @param {String} uid The self session ID.
 * @param {String} sid The self session socket connection ID. This
 *   is used by the signalling socket connection as ID to target
 *   self and the peers Peer ID.
 * @param {String} timeStamp The self session timestamp.
 * @param {String} token The self session access token.
 * @required
 * @private
 * @component User
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._user = null;

/**
 * Stores the custom user data information set by developer for self.
 * By default, if no custom user data is set, it is an empty string <code>""</code>.
 * @attribute _userData
 * @type JSON|String
 * @default ""
 * @required
 * @private
 * @component User
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._userData = '';

/**
 * Sets the current custom user data information for self.
 * This sets and overwrites the <code>peerInfo.userData</code> value for self.
 * If self is in the room and connected with other peers, the peers will be notified
 *   with the {{#crossLink "Skylink/peerUpdated:event"}}peerUpdated{{/crossLink}} event.
 * You may get the current customer user data information for self in
 *   {{#crossLink "Skylink/getUserData:method"}}getUserData(){{/crossLink}}.
 * @method setUserData
 * @param {JSON|String} userData The custom (or updated) user data information
 *   for self provided.
 * @example
 *   // Example 1: Intial way of setting data before user joins the room
 *   SkylinkDemo.setUserData({
 *     displayName: "Bobby Rays",
 *     fbUserId: "1234"
 *   });
 *
 *   // Example 2: Way of setting data after user joins the room
 *   var userData = SkylinkDemo.getUserData();
 *   userData.displayName = "New Name";
 *   userData.fbUserId = "1234";
 *   SkylinkDemo.setUserData(userData);
 * @trigger peerUpdated
 * @component User
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.setUserData = function(userData) {
  var self = this;
  // NOTE ALEX: be smarter and copy fields and only if different
  self._parseUserData(userData);

  if (self._inRoom) {
    log.log('Updated userData -> ', userData);
    self._sendChannelMessage({
      type: self._SIG_MESSAGE_TYPE.UPDATE_USER,
      mid: self._user.sid,
      rid: self._room.id,
      userData: self._userData
    });
    self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
  } else {
    log.warn('User is not in the room. Broadcast of updated information will be dropped');
  }
};

/**
 * Gets the current custom user data information for self.
 * You may set the current customer user data information for self in
 *   {{#crossLink "Skylink/setUserData:method"}}setUserData(){{/crossLink}}.
 * @method getUserData
 * @return {JSON|String} The custom (or updated) user data information
 *   for self set.
 * @example
 *   // Example 1: To get other peer's userData
 *   var peerData = SkylinkDemo.getUserData(peerId);
 *
 *   // Example 2: To get own userData
 *   var userData = SkylinkDemo.getUserData();
 * @component User
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.getUserData = function(peerId) {
  if (peerId && peerId !== this._user.sid) {
    // peer info
    var peerInfo = this._peerInformations[peerId];

    if (typeof peerInfo === 'object') {
      return peerInfo.userData;
    }

    return null;
  }
  return this._userData;
};

/**
 * Parses the custom user data information for self provided.
 * @method _parseUserData
 * @param {JSON} [userData] The custom (or updated) user data information
 *   for self provided.
 * @private
 * @component User
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._parseUserData = function(userData) {
  log.debug('Parsing user data:', userData);

  this._userData = userData || '';
};

/**
 * Gets the Peer information.
 * If an invalid Peer ID is provided, or no Peer ID is provided,
 *   the method will return the self peer information.
 * @method getPeerInfo
 * @param {String} [peerId] The Peer information to retrieve the
 *   data from. If the Peer ID is not provided, it will return
 *   the self Peer information.
 * @return {JSON} The Peer information. The parameters relates to the
 *   <code>peerInfo</code> payload given in the
 *   {{#crossLink "Skylink/peerJoined:event"}}peerJoined{{/crossLink}} event.
 * @example
 *   // Example 1: To get other peer's information
 *   var peerInfo = SkylinkDemo.getPeerInfo(peerId);
 *
 *   // Example 2: To get own information
 *   var userInfo = SkylinkDemo.getPeerInfo();
 * @component Peer
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.getPeerInfo = function(peerId) {
  var isNotSelf = this._user && this._user.sid ? peerId !== this._user.sid : false;

  if (typeof peerId === 'string' && isNotSelf) {
    // peer info
    var peerInfo = this._peerInformations[peerId];

    if (typeof peerInfo === 'object') {
      return peerInfo;
    }

    return null;
  } else {

    var mediaSettings = {};
    var mediaStatus = clone(this._mediaStreamsStatus) || {};

    // add screensharing information
    if (!!this._mediaScreen && this._mediaScreen !== null) {
      mediaSettings = clone(this._screenSharingStreamSettings);
      mediaSettings.bandwidth = clone(this._streamSettings.bandwidth);

      if (mediaSettings.video) {
        mediaSettings.video = {
          screenshare: true
        };
      }
    } else {
      mediaSettings = clone(this._streamSettings);
    }

    if (!mediaSettings.audio) {
      mediaStatus.audioMuted = true;
    }

    if (!mediaSettings.video) {
      mediaStatus.videoMuted = true;
    }

    return {
      userData: clone(this._userData) || '',
      settings: mediaSettings || {},
      mediaStatus: mediaStatus,
      agent: {
        name: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion
      },
      room: clone(this._selectedRoom)
    };
  }
};
