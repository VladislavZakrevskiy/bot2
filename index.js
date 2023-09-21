const telegramApi = require('node-telegram-bot-api')
const token = '2120614172:AAH2XrcZRb3hE2bX95UviTL6h0uSZZAEYLM'

const bot = new telegramApi(token, {
    polling: true
})

function doString(arr){
	let a = []
	for(let i=0;i<arr.length;i++){
		a.push(`${i+1}: ${arr[i]}`)
	}
	a.join('\n')    
}

function createCombinationsIterator(n, k) {
    let x = 0, y = 0, z = 0;
    let p = new Array(n + 2);
    let c = new Array(k);

    let init = function () {
        let i;
        p[0] = n + 1;
        for (i = 1; i != n - k + 1; i++) {
            p[i] = 0;
        }
        while (i != n + 1) {
            p[i] = i + k - n;
            i++;
        }
        p[n + 1] = -2;
        if (k == 0) {
            p[1] = 1;
        }
        for (i = 0; i < k; i++) {
            c[i] = i + n - k;
        }
    };

    let twiddle = function () {
        let i, j, m;
        j = 1;
        while (p[j] <= 0) {
            j++;
        }
        if (p[j - 1] == 0) {
            for (i = j - 1; i != 1; i--) {
                p[i] = -1;
            }
            p[j] = 0;
            x = z = 0;
            p[1] = 1;
            y = j - 1;
        } else {
            if (j > 1) {
                p[j - 1] = 0;
            }
            do {
                j++;
            } while (p[j] > 0);
            m = j - 1;
            i = j;
            while (p[i] == 0) {
                p[i++] = -1;
            }
            if (p[i] == -1) {
                p[i] = p[m];
                z = p[m] - 1;
                x = i - 1;
                y = m - 1;
                p[m] = -1;
            } else {
                if (i == p[0]) {
                    return false;
                } else {
                    p[j] = p[i];
                    z = p[i] - 1;
                    p[i] = 0;
                    x = j - 1;
                    y = i - 1;
                }
            }
        }
        return true;
    };

    let first = true;
    init();

    return {
        hasNext: function () {
            if (first) {
                first = false;
                return true;
            } else {
                let result = twiddle();
                if (result) {
                    c[z] = x;
                }
                return result;
            }
        },
        getCombination: function () {
            return c;
        }
    };
}

bot.setMyCommands([{
    command: '/start',
    description: "Начать работу с ботом"
}, {
    command: "/give_list",
    description: "Дать боту список"
}, ])


function main() {
    bot.on('message', async msg => {
        let chatId = msg.chat.id
        let text = msg.text
        if (text === '/start') {
            return bot.sendMessage(chatId,
                `Приветствуем в боте-компараторе,
он за вас может определить приоритетность задачи,
основываясь на ваших выборах`)
        }
        if (text === '/give_list') {
            return bot.sendMessage(chatId, 'Напиши через точку с запятой, как тебе удобно, все твои задачи')
                .then(async () => bot.on('message', async msg => {
                    let thisMes = msg.text
                    let thisArr = thisMes.split(';')
                    let readyArr = []
                    for (let i = 0; i < thisArr.length; i++) {
                        readyArr.push({
                            text: thisArr[i],
                            score: 0
                        })
                    }
					let iterator = (createCombinationsIterator(readyArr.length, 2)) 
					let arr = []
					while (iterator.hasNext()) {
						let combination = iterator.getCombination();
						arr.push(combination.map(index => readyArr[index]))
					}
					for(let i = 0;i<arr.length;i++){
						let keyboard = {
							reply_markup: JSON.stringify({
								inline_keyboard: [[{ 
									text: arr[i][0].text, 
									callback_data: `${i},0`
									}], [{
									text: arr[i][1].text,
									callback_data: `${i},1`
									}]] 
							})
						}
						bot.sendMessage(chatId, 'Что лучше?', keyboard)
					} //for
					let allsum = 0
					
					bot.on('callback_query', async(msg)=>{
						let [index, role] = msg.data.split(',') 
						arr[index][role].score += 1
						allsum+=1
						let set = new Set
						
						if(allsum==arr.length){
							for(let i=0;i<arr.length;i++){
								set.add(arr[i][0])
								set.add(arr[i][1])
							}
							let setArr = []
							set.forEach((el)=>{
								setArr.push(el)
							})
							 
							let finalSet = setArr.sort(function(a,b){ return b.score - a.score})
							bot.sendMessage(chatId, doString(finalSet))
							
						}
						
						//bot.deleteMessage(chatId, msg.message.message_id)    
					})
                }))

        }
        return bot.sendMessage(chatId, 'Честно, я тебя не понимаю')
    })
}

main()



/**
 * keyboard = {
	reply_markup: JSON.stringify({
		inline_keyboard: [[{ 
			text: readyArr[i].text,
			callback_data: readyArr[i].text
			}], [{
			text: readyArr[m].text,
			callback_data: readyArr[m].text
			}]] 
	}
 */