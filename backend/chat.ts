const { Client } = require('@elastic/elasticsearch');
const elasticConfig = require('config').get('elastic');

// TODO pagination
// TODO retries

interface Message {
    text: string
    from: string
    to:string
  }

class ChatClient {
    client: any
    from: string
    
    constructor(from: string) {
        this.from = from;
        
    }
    put(text: String, to: string) {
    try {
        this.client.index({
            index: elasticConfig.chat_index_name,
            body: {
                text: text,
                from: this.from,
                to: to,
            }
            
            
        });
    } catch (error) {
        console.log("Errore")
    }
        
    }

    get(from:string,to: string) {
        return this.client.search({
            index: elasticConfig.chat_index_name,
            query: {
                "bool": {
                    "should":[{
                        dis_max:{
                        queries:[{
                        match:{
                            to:to,
                            
                        },},
                      { match:{
                           
                            from:from
                        },},
                    
                    ]}   
                        },
                        {
                            dis_max:{
                            queries:[{
                            match:{
                                to:from,
                                
                            },},
                          { match:{
                               
                                from:to
                            },},
    
                        ]   }
                            },
                    ]
                
                }
            }
            
        });
    }
}
try {
    ChatClient.prototype.client = new Client({
        nodes: elasticConfig.nodes,
    });
} catch (error) {
    
}



ChatClient.prototype.client.info()
  .then(response => console.log(response))
  .catch(error => console.error(error));

module.exports = { ChatClient };
