import traceback

if __name__ == "__main__":
    try:
        import atena_langgraph_memory
    except Exception as e:
        with open("err_clean2.txt", "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        print("Logged error to err_clean2.txt")
