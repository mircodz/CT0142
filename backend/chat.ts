const { Client } = require('@elastic/elasticsearch');
const elasticConfig = require('config').get('elastic');

// TODO pagination
// TODO retries
class ChatClient {
    client: any
    from: string

    constructor(from: string) {
        this.from = from;
    }

    put(text: String, to: string) {
        
        this.client.index({
            index: elasticConfig.chat_index_name,
            body: {
                text: text,
                from: this.from,
                to: to,
            }
        });
    }

    get(to: string) {
        return this.client.search({
            index: elasticConfig.chat_index_name,
            body: {
                query: {
                    match: { to: to }
                }
            }
        });
    }
}

ChatClient.prototype.client = new Client({
    nodes: elasticConfig.nodes,
});

ChatClient.prototype.client.info()
  .then(response => console.log(response))
  .catch(error => console.error(error));

module.exports = { ChatClient };
