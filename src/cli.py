"""Command-line interface (CLI) for Enterprise Hybrid Search Engine."""

import argparse
import sys
import json
from src.config import settings
from src.api.app import app_state


def main():
    parser = argparse.ArgumentParser(
        description="Synapse: Enterprise Hybrid Search & Document Intelligence Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Serve command
    serve_parser = subparsers.add_parser("serve", help="Start the FastAPI server")
    serve_parser.add_argument("--port", type=int, default=settings.port, help="Port to listen on")

    # Query command
    query_parser = subparsers.add_parser("query", help="Execute a hybrid search query via CLI")
    query_parser.add_argument("query_text", type=str, help="Search query string")
    query_parser.add_argument(
        "--mode",
        choices=["hybrid", "dense", "bm25"],
        default="hybrid",
        help="Retrieval mode (default: hybrid)",
    )
    query_parser.add_argument("--top-k", type=int, default=5, help="Number of chunks to retrieve")

    # Evals command
    evals_parser = subparsers.add_parser("evals", help="Run Ragas benchmark evaluation suite")

    args = parser.parse_args()

    if args.command == "serve":
        from src.api.server import run_server
        run_server()

    elif args.command == "query":
        print(f"\n🔍 Executing {args.mode.upper()} Search: '{args.query_text}'")
        app_state.bootstrap_default_documents()

        retrieved = app_state.engine.retrieve(
            query=args.query_text,
            mode=args.mode,
            top_k=args.top_k,
        )

        resp = app_state.synthesizer.synthesize(
            query=args.query_text,
            retrieved_chunks=retrieved,
            retrieval_mode=args.mode,
        )

        print("\n" + "=" * 60)
        print("💡 GROUNDED ANSWER:")
        print("=" * 60)
        print(resp.answer)
        print("\n" + "=" * 60)
        print(f"📚 CITATIONS ({len(resp.citations)} verified):")
        print("=" * 60)
        for cit in resp.citations:
            print(f"[{cit.citation_id}] {cit.document_title} - {cit.section_title} (Page {cit.page_number})")
            print(f"    Excerpt: \"{cit.exact_quote}\"\n")

        print(f"⏱️  Latency: {resp.latency_ms:.1f}ms | Faithfulness: {resp.faithfulness_score * 100:.0f}%")

    elif args.command == "evals":
        print("\n📊 Running Ragas Benchmark Suite across 10 Enterprise Queries...")
        app_state.bootstrap_default_documents()
        from src.evals.ragas_evaluator import RagasEvaluator

        evaluator = RagasEvaluator(app_state.engine, app_state.synthesizer)
        matrix = evaluator.run_comparative_matrix()

        print("\n" + "=" * 70)
        print(f"{'RETRIEVAL MODE':<20} | {'PRECISION':<10} | {'RECALL':<10} | {'FAITHFUL':<10} | {'RELEVANCE':<10}")
        print("=" * 70)
        for key, stats in matrix.items():
            print(
                f"{stats['name']:<20} | {stats['avg_context_precision']*100:>8.1f}% | "
                f"{stats['avg_context_recall']*100:>8.1f}% | {stats['avg_faithfulness']*100:>8.1f}% | "
                f"{stats['avg_answer_relevance']*100:>8.1f}%"
            )
        print("=" * 70 + "\n")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
