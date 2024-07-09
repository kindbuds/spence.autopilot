
const sendToApi = async (url, data, response_type = 'text', method = 'GET') => {
    let fetch;  // Declare fetch variable outside the try block

    // Dynamically import the fetch function
    fetch = (await import('node-fetch')).default;

    // logToFile(`sendToApi: ${url} ${JSON.stringify(data)}`);
    console.log(`sendToApi: ${url} ${JSON.stringify(data)}`)
    try {
        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (method === 'POST') {
            requestOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let response_data;
        switch (response_type) {
            case 'text':
                response_data = await response.text();
                break;
            case 'json':
                response_data = await response.json();
                break;
            default:
                response_data = await response.arrayBuffer();
                break;
        }

        return response_data;
    } catch (error) {
        throw error;  // Propagate the error to the caller
    }
};


async function fetchComments(postId) {
    // try {
    // Fetch the post data to get the top-level comment IDs
    const response = await sendToApi(`https://hacker-news.firebaseio.com/v0/item/${postId}.json`, null, 'json');
    const postData = response;
    console.log(postData, 'postData')


    if (postData && postData.kids) {
        // Fetch each top-level comment using their IDs
        const commentsPromises = postData.kids.map(id =>
            sendToApi(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, null, 'json')
        );

        const comments = await Promise.all(commentsPromises);

        // Filter comments to only those with text length of at least 500 characters
        const lengthyComments = comments.filter(comment => comment.text && comment.text.length >= 500);

        // Print each filtered top-level comment's text
        lengthyComments.forEach(comment => {
            if (comment.text) {
                console.log(`Comment by ${comment.by} (${comment.id}): ${comment.text}\n`);
            }
        });

        console.log(lengthyComments.length, 'lengthyComments.length')
    } else {
        console.log('No comments found or the post does not exist.');
    }
    // } catch (error) {
    //     console.error('Failed to fetch comments:', error);
    // }
}

// Replace '2921983' with the ID of the post you're interested in
fetchComments(40563283);
