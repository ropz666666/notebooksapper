
interface Message {
    content: string;
    role: "assistant" | "user" | "error" | "progress";
}

type SetMessages = React.Dispatch<React.SetStateAction<Message[]>>;

export class ClientChatController {
    private readonly setMessages: SetMessages;
    protected readonly messages: Message[];
    private onError?: (errorMessage: string) => void; // 错误回调函数
    constructor(
        messages: Message[],
        setMessages: SetMessages,
        source: number[],
        notes: number[]
    ) {
        this.messages = messages;
        this.setMessages = setMessages;

        // 获取最后一条用户消息
        const userMessage = messages[messages.length - 1];

        // 构建请求 URL（source 和 notes 作为查询参数）
        const url = `sse/ClientLLMResponse?source=${source.join(",")}&notes=${notes.join(",")}`;

        // 使用 fetch 发起 POST 请求
        this.fetchSSE(url, userMessage.content);
    }


    /**
     * 使用 fetch 发起 POST 请求并处理 SSE 数据流
     * @param url SSE 的 URL
     * @param message 用户消息内容
     */
    private async fetchSSE(url: string, message: string) {

        try {
            const user=JSON.parse(localStorage.getItem("userInfo"));

            console.log("user", user);
            const response = await fetch("https://ai.jxnu.edu.cn/spn/v1/notebook/sse/ClientLLMResponse", {
                method: "POST", // 使用 POST 方法
                headers: {
                    "Content-Type": "application/json",
                    "User-ID": user.id || "", // 添加 User-ID 头
                },
                body: JSON.stringify({ message }), // 将 message 放在请求体中
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 检查响应内容类型是否为 text/event-stream
            const contentType = response.headers.get("content-type");
            console.log(contentType)
            if (!contentType || !contentType.includes("text/event-stream")) {
                throw new Error("Invalid content type. Expected text/event-stream.");
            }

            // 使用 ReadableStream 处理 SSE 数据流
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No readable stream found.");
            }

            const decoder = new TextDecoder(); // 用于解码二进制数据为字符串
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("Stream complete");
                    break;
                }

                // 解码数据块
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // 处理 SSE 格式的数据
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 剩余未处理的数据放回 buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.replace("data: ", "").trim();

                        // 过滤出 AI 输出的文本
                        if (data) {
                            this.handleStreamData(data);
                        }
                    }
                }
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理流式数据
     * @param data 从服务器接收到的数据
     */
    private handleStreamData(data: string, isDone: boolean = false) {
        console.log("Received data:", JSON.stringify(data)); // 打印接收到的数据
        this.setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];

            if (lastMessage && lastMessage.role === "assistant") {
                const updatedMessage: Message = {
                    ...lastMessage,
                    content: lastMessage.content + data, // 逐步追加新内容
                };
                return [...prevMessages.slice(0, -1), updatedMessage];
            } else {
                const newMessage: Message = {
                    role: "assistant", // 假设服务器返回的是助手消息
                    content: data, // 初始内容
                };
                return [...prevMessages, newMessage];
            }
        });

        if (isDone) {
            this.finalizeMessage(); // 处理流结束的逻辑
        }
    }

    private finalizeMessage() {
        console.log("Stream ended. Final message:", this.messages[this.messages.length - 1]);
    }

    // private handleError(error: unknown) {
    //     console.error("SSE connection error:", error);
    //
    //     const errorMessage: Message = {
    //         role: "error",
    //         content: "Connection error. Please try again.",
    //     };
    //
    //     this.setMessages((prevMessages) => [...prevMessages, errorMessage]);
    // }

    //处理报错
    private handleError(error: unknown) {
        console.error("SSE connection error:", error);

        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

        // 将错误信息添加到消息列表
        const errorMessageObj: Message = {
            role: "error",
            content: errorMessage,
        };
        this.setMessages((prevMessages) => [...prevMessages, errorMessageObj]);

        // 调用错误回调函数
        if (this.onError) {
            this.onError(errorMessage);
        }
    }
}