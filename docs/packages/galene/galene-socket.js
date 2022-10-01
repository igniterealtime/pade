class GaleneSocket
{
    constructor(connection, host) {
		this.OPEN = connection.connected;
		this.connection = connection;	
		this.readyState = this.OPEN;
		this.host = host;
		
		this.connection.addHandler((iq) => {
			const json_ele = iq.querySelector("json");
			console.debug('GaleneSocket handler', json_ele.innerHTML);				
			
			if (this.onmessage) this.onmessage({data: json_ele.innerHTML});			
			return true;
			
		}, "urn:xmpp:sfu:galene:0", 'iq', 'set');	
		
		setTimeout(() => {
			console.debug('GaleneSocket start');			
			if (this.onopen) this.onopen();				
		});

		console.debug('GaleneSocket constructor', this);			
	}
	
	close(code, reason) {
		console.debug('GaleneSocket close', code, reason);

		this.connection.sendIQ($iq({type: 'set', to: this.host}).c('c2s', {xmlns: 'urn:xmpp:sfu:galene:0'}), (res) => {
			if (this.onclose) this.onclose({code, reason});		
		});	
	}
	
	send(text) {
		console.debug('GaleneSocket send', text);			
		this.connection.sendIQ($iq({type: 'set', to: this.host}).c('c2s', {xmlns: 'urn:xmpp:sfu:galene:0'}).c('json', {xmlns: 'urn:xmpp:json:0'}).t(text), (res) => {
			//console.debug('GaleneSocket send response', res);	
		});			
	}
	
}