/**
 * Handles the XMLHttpPeer and API function calls.
 * @class Peer
 * @for Skylink
 * @since 0.6.0
 */
function Peer(config, listener) {
  'use strict';

  // Reference of instance
  var com = this;

  /**
   * The peer id.
   * @attribute id
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.id = config.id || null;

  /**
   * The user id that the peer is tied to.
   * @attribute userId
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.userId = config.userId;

  /**
   * The peer readyState.
   * @attribute readyState
   * @type String
   * @required
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.readyState = 'new';

  /**
   * The PeerConnection constraints.
   * @attribute constraints
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.constraints = config.constraints;

  /**
   * The PeerConnection configuration.
   * @attribute config
   * @type String
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.config = config.config || {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };

  /**
   * The stream object.
   * @attribute stream
   * @type Stream
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.stream = null;

  /**
   * The list of DataChannels connected to Peer.
   * @attribute datachannels
   * @param {DataChannel} main The main DataChannel for sending chats.
   * @param {JSON} transfers The list of datachannel(s) for transfers.
   * @param {DataChannel} [transfers.n=*] The DataChannel for sending data.
   * @type Stream
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.datachannels = {
    main: null,
    transfers: {}
  };

  /**
   * The PeerConnection object.
   * @attribute RTCPeerConnection
   * @type Object
   * @private
   * @for Peer
   * @since 0.6.0
   */
  com.RTCPeerConnection = null;

  /**
   * Starts the peer connection.
   * @method connect
   * @trigger peerJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.connect = function (constraints) {
    var peer = new window.RTCPeerConnection(com.config, constraints);
    com.constraints = constraints;
    com.bind(peer);
  };

  /**
   * Stops the peer connection.
   * @method disconnect
   * @trigger peerJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.disconnect = function (config) {
    com.RTCPeerConnection.close();
  };

  /**
   * Binds events to RTCPeerConnection object.
   * @method bind
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.bind = function (bindPeer) {
    bindPeer.queueCandidate = [];
    bindPeer.iceConnectionFiredStates = [];
    bindPeer.newSignalingState = 'new';
    bindPeer.newIceConnectionState = 'checking';

    bindPeer.ondatachannel = function (event) {
      //var dc = event.channel || event;
      com.onDataChannel(event);
    };

    bindPeer.onaddstream = function (event) {
      com.onAddStream(event);
    };

    bindPeer.onicecandidate = function (event) {
      com.onIceCandidate(event, bindPeer);
    };

    bindPeer.oniceconnectionstatechange = function (event) {
      ICE.parseIceConnectionState(bindPeer);
    };
    
    bindPeer.oniceconnectionnewstatechange = function (event) {
      com.onIceConnectionStateChange(bindPeer);
    };

    // bindPeer.onremovestream = function (event) {};

    bindPeer.onsignalingstatechange = function (event) {
      bindPeer.newSignalingState = bindPeer.signalingState;
      com.onSignalingStateChange(event);
    };

    bindPeer.onicegatheringstatechange = function () {
      com.onIceGatheringStateChange(event);
    };
  };

  /**
   * Handles the event when a datachannel is received.
   * @method onDataChannel
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onDataChannel = function (event) {
    var received = event.channel || event;

    var channel = new DataChannel(received, null, function (event, data) {
      listener(event, data);
    });

    if (channel.label === 'main') {
      com.datachannels.main = channel;
    } else {
      com.datachannels.transfers[channel.label] = channel;
    }
  };

  /**
   * Handles the event when a remote stream is received.
   * @method onAddStream
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onAddStream = function (event) {
    var received = event.stream || event;

    com.stream = new Stream(received, null, function(event, data) {
      listener(event, data);
    });
  };

  /**
   * Handles the event when an ice candidate is received.
   * @method onIceCandidate
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onIceCandidate = function (event, bindPeer) {
    var received = event.candidate || event;

    ICE.addCandidate(bindPeer, received);
  };

  /**
   * Handles the event when an ice connection state changes.
   * @method onIceConnectionStateChange
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onIceConnectionStateChange = function (event, bindPeer) {
    listener('peer:iceconnectionstate', {
      id: com.id,
      userId: userId,
      state: newState
    });
  };

  /**
   * Handles the event when a peer connection state changes.
   * @method onSignalingStateChange
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onSignalingStateChange = function (event, bindPeer) {
    var state = bindPeer.signalingState;
    listener('peer:signalingstate', {
      id: com.id,
      userId: userId,
      state: state
    });
  };

  /**
   * Handles the event when an ice gathering state changes.
   * @method onIceGatheringStateChange
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.onIceGatheringStateChange = function (event, bindPeer) {
    var state = ICE.parseIceGatheringState(bindPeer.iceGatheringState);
  };

  /**
   * Creates an offer session description.
   * @method createOffer
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.createOffer = function () {
    com.RTCPeerConnection.createOffer(function (offer) {
      listener('peer:local_offer:success', offer);

      com.setLocalDescription(offer);

    }, function (error) {
      listener('peer:local_offer:failure', error);
    });
  };

  /**
   * Creates an answer session description.
   * @method createAnswer
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.createAnswer = function () {
    com.RTCPeerConnection.createAnswer(function (offer) {
      listener('peer:local_answer:success', offer);

      com.setLocalDescription(offer);

    }, function (error) {
      listener('peer:local_answer:failure', error);
    });
  };
  
  /**
   * Sets local description.
   * @method setLocalDescription
   * @for Peer
   * @since 0.6.0
   */
  com.setLocalDescription = function (localDescription) {
    var sdpLines = localDescription.sdp.split('\r\n');
    sdpLines = SDP.removeH264Support(sdpLines);

    if (fn.isSafe(function () { return com.stream.config.audio.stereo; ))) {
      sdpLines = SDP.addStereo(sdpLines);
    }
    if (globals.bandwidth) {
      sdpLines = SDP.setBitrate(sdpLines, globals.bandwidth);
    }

    localDescription.sdp = sdpLines.join('\r\n');
    
    com.RTCPeerConnection.setLocalDescription(localDescription, function () {
      listener('peer:local_description:success');

      if (localDescription.type === 'answer') {
        com.RTCPeerConnection.newSignalingState = 'have-local-answer';
      }

    }, function (error) {
      listener('peer:local_description:error', error);
    });
  };
                  
  /**
   * Sets remote description.
   * @method setRemoteDescription
   * @for Peer
   * @since 0.6.0
   */
  com.setRemoteDescription = function (remoteSdp) {
    var remoteDescription = new window.RTCSessionDescription(remoteSdp);
    
    com.RTCPeerConnection.setRemoteDescription(remoteDescription, function () {
      listener('peer:remote_description:success');

      if (remoteDescription.type === 'answer') {
        com.RTCPeerConnection.newSignalingState = 'have-remote-answer';
      }

    }, function (error) {
      listener('peer:remote_description:error', error);
    });
  };

  /**
   * Sends the local MediaStream object to peer.
   * @method streamStream
   * @param {Stream} stream The stream object to send.
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.sendStream = function (streamId, config) {
    com.RTCPeerConnection.addStream(stream.MediaStream);
  };
  
  /**
   * Sends the local MediaStream object to peer.
   * @method streamStream
   * @param {Stream} stream The stream object to send.
   * @trigger StreamJoined, mediaAccessRequired
   * @for Peer
   * @since 0.6.0
   */
  com.createDataChannel = function (transferId) {
    if (fn.isEmpty(transferId)) {
      com.datachannels.main = new DataChannel(com, {
        id: com.id
      }, function (event, data) {
        listener(event, data);
      });

    } else {
      com.datachannels[transferId] = new DataChannel(com, {
        id: transferId
      }, function (event, data) {
        listener(event, data);
      });
    }
  };

  // Throw an error if adapterjs is not loaded
  if (!window.RTCPeerConnection) {
    throw new Error('Required dependency adapterjs not found');
  }
}