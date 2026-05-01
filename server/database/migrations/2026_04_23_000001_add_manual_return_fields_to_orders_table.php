<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('returned_by')->nullable()->after('is_reordered');
            $table->timestamp('returned_at')->nullable()->after('returned_by');
            $table->string('return_notes', 500)->nullable()->after('returned_at');

            $table->foreign('returned_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['returned_by']);
            $table->dropColumn(['returned_by', 'returned_at', 'return_notes']);
        });
    }
};
