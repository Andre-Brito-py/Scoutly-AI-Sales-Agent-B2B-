<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ab_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->string('variant_name'); // A, B
            $table->integer('send_count')->default(0);
            $table->integer('conversion_count')->default(0);
            $table->timestamps();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->string('ab_variant', 1)->default('A')->after('campaign_id');
            $table->string('reply_sentiment')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ab_tests');
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['ab_variant', 'reply_sentiment']);
        });
    }
};
