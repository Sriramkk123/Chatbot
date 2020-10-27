onload = function(){
    // outputs a javascript object from the parsed json

        var chat = {
            messageToSend: '',
            init: async function() {
                this.chatTree = new ChatTree();
                await this.chatTree.init();
                this.cacheDOM();
                this.bindEvents();
                await this.render();
            },
            cacheDOM: function() {
                this.$chatHistory = $('.chat-history');
                this.$button = $('button');
                this.$textarea = $('#message-to-send');
                this.$chatHistoryList =  this.$chatHistory.find('ul');
            },
            bindEvents: function() {
                this.$button.on('click', this.addMessage.bind(this));
                this.$textarea.on('keyup', this.addMessageEnter.bind(this));
            },
            render: async function() {
                this.scrollToBottom();
                if (this.messageToSend.trim() !== '') {
                    var template = Handlebars.compile( $("#message-template").html());
                    var context = {
                        messageOutput: this.messageToSend,
                        time: this.getCurrentTime()
                    };

                    this.input = this.messageToSend;
                    this.$chatHistoryList.append(template(context));
                    this.scrollToBottom();
                    this.$textarea.val('');

                    // responses
                    var templateResponse = Handlebars.compile( $("#message-response-template").html());
                    var contextResponse = {
                        response: await this.chatTree.getMessage(this.input),
                        time: this.getCurrentTime()
                    };

                    setTimeout(function() {
                        this.$chatHistoryList.append(templateResponse(contextResponse));
                        this.scrollToBottom();
                    }.bind(this), 1000);

                }

            },

            addMessage: function() {
                this.messageToSend = this.$textarea.val();
                this.render();
            },
            addMessageEnter: function(event) {
                // enter was pressed
                if (event.keyCode === 13) {
                    this.addMessage();
                }
            },
            scrollToBottom: function() {
                this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
            },
            getCurrentTime: function() {
                return new Date().toLocaleTimeString().
                replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
            }
        };

        chat.init();
};

class ChatTree {

    constructor() {
    }

    async init(){
        const data = await this.reset();
        this.chat_tree = data;
        //console.log("Inside init");
        this.firstMsg = true;
        //console.log("inside done");
        return "Chat has now been terminated. Send anything to begin chat again !";
    }

    async reset(){
        const response = await fetch('chat_tree.json');
        const jsonResponse = await response.json();
        return jsonResponse;
    }

    async getMessage(input)
    {
        let resp = '';
        input = new String(input.trim());
        //console.log(input);
        if(this.firstMsg===true) 
        {
            this.firstMsg = false;
            resp += "Hey there buddy<br>";
        } 
        else if(parseInt(input) == 4)
        {
            resp += 'Bye bye!';
            this.init();
            return resp;
        }
        else 
        {

            if(("message" in this.chat_tree) && (input.trim()==="Continue") || (("message" in this.chat_tree) && (input.trim()==="continue"))) 
            {
                return this.init();
            }

            if(isNaN(parseInt(input)) || parseInt(input)<=0 || parseInt(input) > this.chat_tree['children'].length+1)
                return 'It seems like you gave a wrong input ! Go ahead try again !';

            if(parseInt(input)-1===this.chat_tree['children'].length)
            {
                this.init();
            }

            this.chat_tree = this.chat_tree['children'][parseInt(input)-1];
        }

        if("message" in this.chat_tree)
        {
            let data;
            if(this.chat_tree['type']==="function")
            {
                // console.log(String(this.chat_tree['message']),String("getJoke()"));
                if(this.chat_tree['message']==="getJoke()")
                {
                    data = await eval(this.chat_tree['message']);
                    let setup = data[0].setup + "<br>";
                    let punchline = data[0].punchline;
                    data = setup + punchline;
                }
            } 
            else
            {
                data = this.chat_tree['message'];
            }
            resp += data;
            resp += "<br><br>Please input <b>Continue</b> to restart chat now";
        } 
        else 
        {
            for (let i in this.chat_tree['child_msg']) {
                resp += String(parseInt(i) + 1) + ". " + this.chat_tree['child_msg'][parseInt(i)] + "<br>";
            }
        }
        return resp;
    }
}

async function getJoke() 
{
    const response = await fetch('https://official-joke-api.appspot.com/random_ten');
    const jsonResp = await response.json();
    return jsonResp;
}
